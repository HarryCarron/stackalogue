import * as THREE from 'three';
import { EXRLoader, GLTFLoader, OrbitControls, type GLTF } from 'three/examples/jsm/Addons.js';

export enum StandardStack3DState {
    idle = 'IDLE',
    loading = 'LOADING',
    failed = 'FAILED',
    autoOrbit = 'AUTO_ORBIT',
    manOrbit = 'MANUAL_ORBIT',
    interuption = 'INTERRUPTION',
}

export enum Stack3DInteruption {
    interuptionCooldown = 'INTERRUPTION_COOLDOWN',
    returnToAutoInteruptionOriginStart = 'RETURN_TO_AUTO_INTERUPTION_ORIGIN_START',
    returnToAutoInteruptionOriginEnd = 'RETURN_TO_AUTO_INTERUPTION_ORIGIN_END',
}

type Stack3DState = StandardStack3DState | Stack3DInteruption;



const INTERRUPTION_COOLDOWN = 3000;

export class Stack3D {

    private readonly _id: string;

    private readonly _canvas: HTMLCanvasElement;

    private readonly _enableDevMode: boolean;

    stateChangeHandlers: ((state: Stack3DState) => void)[] = [];

    constructor(id: string, canvas: HTMLCanvasElement, enableDevMode: boolean = false) {
        this._id = id;
        this._canvas = canvas;
        this._enableDevMode = enableDevMode;
    }

    init(): void {
        const scene = this._initScene();
        const camera = this._initCamera();
        const renderer = this._initRenderer();
        const orbital = this._initOrbialControls(camera, renderer);
        this._initDevMode(scene, camera);

        this._initEXR(renderer, scene);
        this._initGLTF(scene);

        this._animate(renderer, scene, camera, orbital);
    }

    private _animate(
        renderer: THREE.WebGLRenderer,
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        orbital: OrbitControls): void {

        function turn() {
          requestAnimationFrame(turn);
          orbital.update();
          renderer.render(scene, camera);
        }
        turn();
    }

    private _initOrbialControls(
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer
    ): OrbitControls {
        const orbital = new OrbitControls(camera, renderer.domElement);
        orbital.target.set(2, 0, 0); // Optional: set the point to orbit around
        orbital.autoRotate = true;
        orbital.autoRotateSpeed = 0.5; // Adjust speed as desired
        orbital.update();

        return orbital;
    }

    private _initGLTF(
        scene: THREE.Scene,
    ): void {
        const loader = new GLTFLoader();

        loader.load(
            `/${this._id}.glb`,
            (gltf: GLTF) => {
                gltf.scene.position.set(0, 0, 0);
                scene.add(gltf.scene);
            },
            () => {  
                // todo: handle progress
            },
            () => {
                // todo: handle error
            }

        )
    }

    private _initDevMode(
        scene: THREE.Scene, 
        camera: THREE.PerspectiveCamera
    ): void {
            
            if(!this._enableDevMode) return;
            
            const gridHelper = new THREE.GridHelper(20, 20);
            scene.add(gridHelper);
        
            const axesHelper = new THREE.AxesHelper(5);
            scene.add(axesHelper);
        
            const cameraHelper = new THREE.CameraHelper(camera);
            scene.add(cameraHelper);
    }

    private _initEXR(
        renderer: THREE.WebGLRenderer,
        scene: THREE.Scene
    ): void {
        new EXRLoader().load(`/${this._id}.exr`, (texture) => {

            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
              const envMap = pmremGenerator.fromEquirectangular(texture).texture;
              scene.environment = envMap;
            });
        
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.0;
    }

    private _initScene(): THREE.Scene {
        return new THREE.Scene();
    }

    private _initRenderer(): THREE.WebGLRenderer {
            const renderer = new THREE.WebGLRenderer({ canvas: this._canvas, antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);

            return renderer;
    }

    private _initCamera(): THREE.PerspectiveCamera {
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(5, 0, 0);
        camera.updateMatrix();

        return camera;
    }

    registerStateChangeHandler(handler: (state: Stack3DState) => void): void {
        this.stateChangeHandlers.push(handler);
    }

    registerLoadingStateHandler(handler: (state: Stack3DState) => void): void {
        this.stateChangeHandlers.push(handler);
    }

    private _notifyStateChange(state: Stack3DState): void {
        this.stateChangeHandlers.forEach(handler => handler(state));
    }

}
