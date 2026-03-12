import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0,1.6,3);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

const player = new THREE.Group();
player.add(camera);
scene.add(player);

// Floor
const floorGeo = new THREE.PlaneGeometry(50,50);
const floorMat = new THREE.MeshStandardMaterial({color:0x333333});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff,0.5));
const dirLight = new THREE.DirectionalLight(0xffffff,1);
dirLight.position.set(5,10,5);
scene.add(dirLight);

// --- Cubes to shoot ---
const cubes = [];
for(let i=0;i<10;i++){
    const geo = new THREE.BoxGeometry(1,1,1);
    const mat = new THREE.MeshStandardMaterial({color:Math.random()*0xffffff});
    const cube = new THREE.Mesh(geo,mat);
    cube.position.set((Math.random()-0.5)*20,0.5,(Math.random()-0.5)*20);
    scene.add(cube);
    cubes.push(cube);
}

// --- Bullets ---
const bullets = [];

// --- Gamepad ---
let gamepad = null;
window.addEventListener("gamepadconnected", (e)=>{
    gamepad = e.gamepad;
    document.getElementById("status").innerText = `Controller connected: ${gamepad.id}`;
});
window.addEventListener("gamepaddisconnected", ()=> {
    gamepad = null;
    document.getElementById("status").innerText = "Controller disconnected";
});

// --- Movement ---
const MOVE_SPEED = 0.1;
const ROT_SPEED = 0.03;

// --- Shoot ---
function shoot(){
    const bulletGeo = new THREE.SphereGeometry(0.05);
    const bulletMat = new THREE.MeshBasicMaterial({color:0xffff00});
    const bullet = new THREE.Mesh(bulletGeo, bulletMat);
    const pos = new THREE.Vector3();
    camera.getWorldPosition(pos);
    bullet.position.copy(pos);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    bullets.push({mesh:bullet,dir});
    scene.add(bullet);
}

// --- Animate ---
function animate(){
    renderer.setAnimationLoop(render);
}

let score = 0;
function render(){
    // --- Gamepad handling ---
    if(gamepad){
        const gps = navigator.getGamepads();
        for(let gp of gps){
            if(gp && gp.connected && gp.id.toLowerCase().includes("dualshock")){
                // Left stick
                const lsX = gp.axes[0];
                const lsY = gp.axes[1];
                player.translateX(lsX*MOVE_SPEED);
                player.translateZ(lsY*MOVE_SPEED);
                
                // Right stick
                const rsX = gp.axes[2];
                player.rotation.y -= rsX*ROT_SPEED;
                
                // R2 to shoot (button 7)
                if(gp.buttons[7] && gp.buttons[7].pressed){
                    shoot();
                }
            }
        }
    }

    // --- Update bullets ---
    for(let i=bullets.length-1;i>=0;i--){
        const b = bullets[i];
        b.mesh.position.addScaledVector(b.dir,0.3);
        
        // Remove bullets far away
        if(b.mesh.position.distanceTo(player.position)>50){
            scene.remove(b.mesh);
            bullets.splice(i,1);
            continue;
        }

        // Check collisions
        for(let j=cubes.length-1;j>=0;j--){
            const c = cubes[j];
            if(b.mesh.position.distanceTo(c.position)<0.6){
                scene.remove(c);
                cubes.splice(j,1);
                scene.remove(b.mesh);
                bullets.splice(i,1);
                score += 10;
                document.getElementById("score").innerText = `Score: ${score}`;
                break;
            }
        }
    }

    renderer.render(scene,camera);
}

// --- Resize ---
window.addEventListener("resize", ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
});

animate();
