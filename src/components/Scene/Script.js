import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"
import * as dat from 'dat.gui';

//Global variables
let currentRef = null;
const gui = new dat.GUI({ width: 400 });
const sceneParams = {
  envMapIntensity:1,
}

//Scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(25, 100 / 100, 0.1, 100);
scene.add(camera);
camera.position.set(0, 2, 5);
camera.lookAt(new THREE.Vector3());

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.setSize(100, 100);

//OrbitControls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

//Resize canvas
const resize = () => {
  renderer.setSize(currentRef.clientWidth, currentRef.clientHeight);
  camera.aspect = currentRef.clientWidth / currentRef.clientHeight;
  camera.updateProjectionMatrix();
};
window.addEventListener("resize", resize);

//Animate the scene
const animate = () => {
  orbitControls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};
animate();

//Importacion de modelos

//Loading Manager

const loadingManager = new THREE.LoadingManager(
  () => {},
  ( itemUrl,
    itemsToLoad,
    itemsLoaded
  ) => {
   console.log((itemsToLoad/itemsLoaded)*100)
    
  },
  () => {},
)

// cast and receive shadows
const castAndReceiveShadow = () => {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  })
}

//Load model3D
const helmetDraco = new DRACOLoader(loadingManager);
helmetDraco.setDecoderPath('./draco/')

const helmetModelo = new GLTFLoader();
helmetModelo.setDRACOLoader(helmetDraco)
helmetModelo.load('./draco/helmet.gltf', (helmet) => {
  // while (helmet.scene.children.length) {
    scene.add(helmet.scene);
  // }
  castAndReceiveShadow()
},()=>{},()=>{},
)
scene.add(helmetModelo);



//PLane Base
const planeBase = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(20, 20),
  new THREE.MeshStandardMaterial()
);
planeBase.rotation.x = - Math.PI * 0.5;
planeBase.position.y = -3
scene.add(planeBase);

//ligths
const folderLights = gui.addFolder("Lights")

const ligthDirectional = new THREE.DirectionalLight(0xffffff, 1)
ligthDirectional.position.set(2, 2, 1)
ligthDirectional.castShadow = true;
ligthDirectional.shadow.mapSize.set(1024,1024)
scene.add(ligthDirectional)
//tweaks
folderLights.add(ligthDirectional, "intensity")
  .min(1)
  .max(10)
  .step(0.0001)
.name("DL Intensity")


const ligthAmbiental = new THREE.AmbientLight(0xffffff, 0)
scene.add(ligthAmbiental)

folderLights.add(ligthAmbiental, "intensity")
  .min(0.5)
  .max(10)
  .step(0.0001)
.name("AL Intensity")

//Ambientacion del mapa
const envMap = new THREE.CubeTextureLoader().load(
  [
  './envmap/px.png',
  './envmap/nx.png',
  './envmap/py.png',
  './envmap/ny.png',
  './envmap/pz.png',
  './envmap/nz.png',
  ]
)

scene.environment = envMap

folderLights.add(sceneParams, 'envMapIntensity')
  .min(1)
  .max(10)
  .step(0.001)
  .name("EnvMap Intensity")
  .onChange(() => {
    scene.traverse(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.envMapIntensity = sceneParams.envMapIntensity
      }
    })
  })

//Init and mount the scene
export const initScene = (mountRef) => {
  currentRef = mountRef.current;
  resize();
  currentRef.appendChild(renderer.domElement);
};

//Dismount and clena up the buffer from the scene
export const cleanUpScene = () => {
  scene.dispose();
  gui.destroy()
  currentRef.removeChild(renderer.domElement);
};
