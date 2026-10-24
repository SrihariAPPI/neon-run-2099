import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

/**
 * Cockpit Depth-of-Field & Speed Tunnel Blur Shader
 * Emphasizes cabin space and highway velocity by applying optical depth-of-field
 * to foreground dashboard edges and peripheral speed boundaries while maintaining
 * sharp focus on the windshield road ahead.
 */
export const CockpitDofShader = {
  uniforms: {
    tDiffuse: { value: null },
    uFocus: { value: new THREE.Vector2(0.5, 0.46) },
    uDofIntensity: { value: 0.0 }, // 0.0 = disabled, 1.0 = full cockpit DOF
    uSpeed: { value: 0.0 }, // 0.0 to 1.0 normalized speed
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uChroma: { value: 1.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uFocus;
    uniform float uDofIntensity;
    uniform float uSpeed;
    uniform vec2 uResolution;
    uniform float uChroma;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;

      // Bypass when DOF and speed blur are inactive
      if (uDofIntensity < 0.01 && uSpeed < 0.05) {
        gl_FragColor = texture2D(tDiffuse, uv);
        return;
      }

      // Aspect ratio correction for circular optical blur
      float maxDim = max(uResolution.x, uResolution.y);
      vec2 aspectCorr = vec2(uResolution.x / maxDim, uResolution.y / maxDim);
      vec2 delta = (uv - uFocus) * aspectCorr;
      float dist = length(delta);

      // Depth blur weight:
      // Focus is locked onto the road viewed through the windshield.
      // Foreground dashboard (lower edge) and peripheral A-pillars (sides) get natural optical softness.
      float foregroundDefocus = smoothstep(0.48, 0.12, uv.y) * 1.6;
      float pillarDefocus = smoothstep(0.32, 0.88, abs(uv.x - 0.5)) * 1.35;
      float speedTunnel = uSpeed * smoothstep(0.18, 0.72, dist) * 1.5;

      float blurAmount = (foregroundDefocus + pillarDefocus) * uDofIntensity * 0.0075 + speedTunnel * 0.0055;
      blurAmount = clamp(blurAmount, 0.0, 0.014);

      if (blurAmount < 0.0006) {
        gl_FragColor = texture2D(tDiffuse, uv);
        return;
      }

      // 12-tap Poisson disc bokeh kernel
      vec2 samples[12];
      samples[0] = vec2( 0.0,  1.0);
      samples[1] = vec2( 0.866,  0.5);
      samples[2] = vec2( 0.866, -0.5);
      samples[3] = vec2( 0.0, -1.0);
      samples[4] = vec2(-0.866, -0.5);
      samples[5] = vec2(-0.866,  0.5);
      samples[6] = vec2( 0.0,  0.5) * 0.52;
      samples[7] = vec2( 0.433,  0.25) * 0.52;
      samples[8] = vec2( 0.433, -0.25) * 0.52;
      samples[9] = vec2( 0.0, -0.5) * 0.52;
      samples[10]= vec2(-0.433, -0.25) * 0.52;
      samples[11]= vec2(-0.433,  0.25) * 0.52;

      vec4 color = vec4(0.0);
      float totalWeight = 0.0;
      float chromaOffset = blurAmount * 0.38 * uChroma;

      for (int i = 0; i < 12; i++) {
        vec2 offset = samples[i] * blurAmount;
        // Subtle chromatic aberration on out-of-focus edges
        float r = texture2D(tDiffuse, uv + offset + vec2(chromaOffset, 0.0)).r;
        float g = texture2D(tDiffuse, uv + offset).g;
        float b = texture2D(tDiffuse, uv + offset - vec2(chromaOffset, 0.0)).b;
        float a = texture2D(tDiffuse, uv + offset).a;
        color += vec4(r, g, b, a);
        totalWeight += 1.0;
      }

      gl_FragColor = color / totalWeight;
    }
  `,
};

export class CockpitPostProcessor {
  public composer: EffectComposer;
  private renderPass: RenderPass;
  private dofPass: ShaderPass;
  private currentDofIntensity = 0.0;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.composer = new EffectComposer(renderer);

    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    this.dofPass = new ShaderPass(CockpitDofShader);
    this.dofPass.renderToScreen = true;
    this.composer.addPass(this.dofPass);
  }

  public update(isCockpit: boolean, speedNormalized: number, delta: number) {
    const targetDof = isCockpit ? 1.0 : 0.0;
    this.currentDofIntensity = THREE.MathUtils.lerp(this.currentDofIntensity, targetDof, delta * 6);

    this.dofPass.uniforms.uDofIntensity.value = this.currentDofIntensity;
    this.dofPass.uniforms.uSpeed.value = speedNormalized;
  }

  public setSize(width: number, height: number) {
    this.composer.setSize(width, height);
    this.dofPass.uniforms.uResolution.value.set(width, height);
  }

  public render() {
    this.composer.render();
  }

  public dispose() {
    this.composer.dispose();
  }
}
