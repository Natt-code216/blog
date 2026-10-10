export const planetVertexShader = /* glsl */ `
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vPosition = position;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const planetFragmentShader = /* glsl */ `
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.13, 0.71, 0.37));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
          mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
          mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }

  float terrain(vec3 p) {
    float value = 0.0;
    float weight = 0.5;
    for (int i = 0; i < 4; i++) {
      value += weight * noise(p);
      p = p * 2.03 + vec3(4.1, 7.3, 2.7);
      weight *= 0.5;
    }
    return value;
  }

  float contour(float value, float width) {
    float distanceToLine = abs(fract(value - 0.5) - 0.5);
    float pixelWidth = max(fwidth(value), 0.0005);
    return 1.0 - smoothstep(width * pixelWidth, (width + 1.0) * pixelWidth, distanceToLine);
  }

  void main() {
    vec3 p = normalize(vPosition);
    vec3 n = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 lightDirection = normalize(vec3(-0.7, 1.05, 1.25));

    float elevation = terrain(p * 3.5);
    float detail = noise(p * 48.0);
    float terrainBands = elevation * 12.0 + p.y * 4.0;
    float contours = contour(terrainBands, 0.28);
    float largeContours = contour(terrainBands / 4.0, 0.7);

    // The faint survey grid is independent from the land's contour lines.
    float latitude = asin(clamp(p.y, -0.999, 0.999));
    float longitude = atan(p.z, p.x);
    float grid = max(contour(latitude * 8.0, 0.2), contour(longitude * 7.0, 0.15));
    grid *= 1.0 - smoothstep(0.7, 0.98, abs(p.y));

    float diffuse = max(dot(n, lightDirection), 0.0);
    float shade = 0.13 + diffuse * 0.92;
    float face = max(dot(n, viewDirection), 0.0);
    float fresnel = pow(1.0 - face, 3.5);
    float sheen = pow(max(dot(reflect(-lightDirection, n), viewDirection), 0.0), 28.0);

    vec3 deepJade = vec3(0.016, 0.061, 0.046);
    vec3 lightJade = vec3(0.16, 0.31, 0.225);
    vec3 surface = mix(deepJade, lightJade, smoothstep(0.25, 0.72, elevation));
    surface += (detail - 0.5) * 0.025;
    vec3 color = surface * shade;

    float cartography = contours * 0.075 + largeContours * 0.11;
    color += vec3(0.61, 0.73, 0.40) * cartography * (0.30 + diffuse * 0.70);
    color += vec3(0.26, 0.46, 0.31) * grid * 0.13;
    color += vec3(0.52, 0.89, 0.69) * fresnel * (0.12 + diffuse * 0.42);
    color += vec3(0.65, 0.84, 0.62) * sheen * 0.36;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const atmosphereFragmentShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float edge = 1.0 - abs(dot(normalize(vWorldNormal), viewDirection));
    float glow = pow(edge, 5.0) * 0.36;
    gl_FragColor = vec4(0.32, 0.76, 0.52, glow);
    #include <colorspace_fragment>
  }
`;

export const haloVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const haloFragmentShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    float radius = length(vUv - 0.5) * 2.0;
    float glow = exp(-radius * radius * 5.5) * (1.0 - smoothstep(0.68, 1.0, radius));
    gl_FragColor = vec4(0.12, 0.44, 0.28, glow * 0.15);
    #include <colorspace_fragment>
  }
`;
