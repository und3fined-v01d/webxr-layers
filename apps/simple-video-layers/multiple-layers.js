import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory";

import buttonClickSound from "../../media/audio/button-click.mp3";
import MediaLayerManager from "../../util/MediaLayerManager";
import { WebGLRenderer } from "../../util/WebGLRenderer";
import { VRButton } from "../../util/webxr/VRButton";

const SLOTH_TOP_BOTTOM_VIDEO =
    "https://d25a56pc18k0co.cloudfront.net/sloths_binaural_3840x2160_360_3D_v2_injected.mp4";
const SLOTH_LEFT_RIGHT_VIDEO =
    "https://d25a56pc18k0co.cloudfront.net/sloths_binaural_3840_180_3D-injected.mp4";

class App {
    constructor(videoIn = SLOTH_TOP_BOTTOM_VIDEO) {
        const container = document.createElement("div");
        document.body.appendChild(container);

        // Create Camera
        this.camera = this.createCamera();

        // Create Scene
        this.scene = this.createScene();

        // Create Renderer
        this.renderer = this.createRenderer();
        container.appendChild(this.renderer.domElement);

        // Create Orbit Controls
        this.controls = this.createOrbitControls();

        // Track which objects are hit
        this.raycaster = new THREE.Raycaster();

        // Create Map of MediaLayers
        this.mediaLayers = new Map();

        // Create Map of Videos for Each Layer
        this.videos = this.createVideos({
            equirect: videoIn,
            quad: videoIn,
        });

        this.setupVR();

        // We need to bind `this` so that we can refer to the App object inside these methods
        window.addEventListener("resize", this.resize.bind(this));
        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    /**
     * Renders the scene on the renderer
     */
    async render() {
        const xr = this.renderer.xr;
        const session = xr.getSession();

        if (xr.isPresenting) {
            this.mediaLayers.forEach((mediaLayer) => {
                mediaLayer.updateOnRender();
            });
        }

        for (const controller of this.controllers) {
            let objects = [];
            this.mediaLayers.forEach((mediaLayer) => {
                if (mediaLayer) {
                    objects = objects.concat(mediaLayer.objects);
                }
            });

            this.handleToolbarIntersections(controller, objects);
        }

        let isVideosReady = true;
        this.videos.forEach((video) => {
            if (video.readyState !== 4) {
                isVideosReady = false;
            }
        });

        if (
            session &&
            session.renderState.layers &&
            !session.hasMediaLayer &&
            isVideosReady
        ) {
            session.hasMediaLayer = true;
            const mediaFactory = new MediaLayerManager(session, this.renderer);

            const uiConfigEquirect = {
                panelWidth: 2,
                panelHeight: 0.5,
                height: 128,
                position: { x: 0, y: -1, z: -3 },
            };
            const toolbarGroupConfig = {
                rotateXAngle: -Math.PI / 4,
                position: {
                    x: 0,
                    y: 1.6,
                    z: -2,
                },
            };

            const equirect = await mediaFactory.createMediaLayer(
                this.videos.get("equirect"),
                MediaLayerManager.EQUIRECT_LAYER,
                {
                    layout: "stereo-top-bottom",
                },
                uiConfigEquirect,
                toolbarGroupConfig
            );
            this.mediaLayers.set("equirect", equirect);

            const uiConfigQuad = {
                panelWidth: 1,
                panelHeight: 0.2,
                height: 128,
                position: { x: 0, y: 0, z: 0 },
            };
            const quad = await mediaFactory.createMediaLayer(
                this.videos.get("quad"),
                MediaLayerManager.QUAD_LAYER,
                {
                    layout: "stereo-top-bottom",
                    transform: new XRRigidTransform({
                        x: 0.0,
                        y: 1.3,
                        z: -2.75,
                        w: 1.0,
                    }),
                },
                uiConfigQuad
            );
            this.mediaLayers.set("quad", quad);

            // Hide toolbars initially
            this.hideToolbars();

            session.updateRenderState({
                layers: [
                    equirect.layer,
                    quad.layer,
                    session.renderState.layers[0],
                ],
            });
            this.videos.forEach((video) => video.play());
        }

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Builds controllers to show in VR World
     */
    buildControllers() {
        const controllerModelFactory = new XRControllerModelFactory();

        const controllers = [];

        const invisRay = this.buildInvisRay();
        const ray = this.buildRay();

        const onSelectStart = (event) => {
            // Fetch the controller
            const controller = event.target;

            // Play sound effect and ray effect
            const sound = new Audio(buttonClickSound);
            sound.play();

            this.handleSelectStart(controller);
        };

        const onSelectEnd = (event) => {
            const controller = event.target;

            this.handleSelectEnd(controller);
        };

        for (let i = 0; i <= 1; i++) {
            const controller = this.renderer.xr.getController(i);
            controller.add(invisRay.clone());
            controller.add(ray.clone());
            controller.userData.selectPressed = false;
            this.scene.add(controller);

            controller.addEventListener("selectstart", onSelectStart);
            controller.addEventListener("selectend", onSelectEnd);

            controllers.push(controller);

            const grip = this.renderer.xr.getControllerGrip(i);
            const controllerModel = controllerModelFactory.createControllerModel(
                grip
            );
            grip.add(controllerModel);
            this.scene.add(grip);
        }

        return controllers;
    }

    buildInvisRay() {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1),
        ]);
        const mesh = new THREE.LineBasicMaterial({
            transparent: true,
            opacity: 0.0,
        });

        const line = new THREE.Line(geometry, mesh);
        line.name = "invis line";
        line.scale.z = 30;

        return line;
    }

    /**
     * Creates a ray for ray casting
     */
    buildRay() {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1),
        ]);

        const line = new THREE.Line(geometry);
        line.name = "line";
        line.scale.z = 1;

        return line;
    }

    /**
     * Creates a three.js PerspectiveCamera
     */
    createCamera() {
        const camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        // Place the camera at the height of an average person
        camera.position.set(0, 1.6, 0);

        return camera;
    }

    /**
     * Creates Orbit Controls
     */
    createOrbitControls() {
        const controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        controls.target.set(0, 1.6, 0);
        controls.update();

        return controls;
    }

    /**
     * Creates a three.js Renderer
     */
    createRenderer() {
        const renderer = new WebGLRenderer({
            antialias: true,
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputEncoding = THREE.sRGBEncoding;

        return renderer;
    }

    /**
     * Creates a three.js scene
     */
    createScene() {
        const scene = new THREE.Scene();

        return scene;
    }

    createVideo(videoIn) {
        const video = document.createElement("video");
        video.loop = true;
        video.crossOrigin = "anonymous";
        video.preload = "auto";
        video.autoload = true;
        video.src = videoIn;

        video.onloadedmetadata = () => {
            console.log("Video loaded");
        };

        return video;
    }

    createVideos(videos) {
        const videosMap = new Map();
        for (const layerKey in videos) {
            const video = this.createVideo(videos[layerKey]);
            videosMap.set(layerKey, video);
        }

        return videosMap;
    }

    createIntersectPoint() {
        const geometry = new THREE.SphereGeometry(0.02, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0xbbbbbb });
        const intersectPoint = new THREE.Mesh(geometry, material);

        return intersectPoint;
    }

    handleSelectEnd(controller) {
        this.mediaLayers.forEach((layerObj, layerKey) => {
            if (layerObj.glassLayer) {
                layerObj.glassLayer.move();
                controller.remove(layerObj.glass);
            }
        });
    }

    /**
     * Gets an array of hits on the UI toolbar
     * @param {*} controller controller to detect hits from
     */
    handleSelectStart(controller) {
        this.mediaLayers.forEach((layerObj, layerKey) => {
            // If toolbar not in view, display it
            if (!this.scene.userData.isToolbarVisible[layerKey]) {
                this.scene.userData.isToolbarVisible[layerKey] = true;
                this.scene.add(layerObj.toolbarGroup);
                if (layerObj.glassLayer) {
                    this.scene.add(layerObj.glass);
                }
            } else {
                // Make toolbar disappear if no interaction with toolbar
                const intersections = this.handleToolbarIntersections(
                    controller,
                    layerObj.objects
                );

                if (intersections.length === 0) {
                    this.scene.userData.isToolbarVisible[layerKey] = false;
                    this.scene.remove(layerObj.toolbarGroup);
                    this.scene.remove(layerObj.glass);
                } else {
                    // Handle the intersection with Toolbar
                    layerObj.update(intersections);
                    if (layerObj.glassLayer) {
                        controller.attach(layerObj.glass);
                    }
                }
            }
        });
    }

    handleToolbarIntersections(controller, objects) {
        if (!objects) {
            return;
            // get array of all meshes if objects to intersect not specified
            // objects = [];
            // this.scene.traverse((o) => {
            //     if (o.isMesh) {
            //         objects.push(o);
            //     }
            // });
        }

        const worldMatrix = new THREE.Matrix4();
        worldMatrix.identity().extractRotation(controller.matrixWorld);

        this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(worldMatrix);

        const intersections = this.raycaster.intersectObjects(objects);

        let areAllToolbarsHidden = true;
        this.mediaLayers.forEach((_layerObj, layerKey) => {
            if (this.scene.userData.isToolbarVisible[layerKey]) {
                areAllToolbarsHidden = false;
            }
        });
        if (areAllToolbarsHidden) {
            this.scene.remove(
                this.scene.getObjectByName(`${controller.uuid} intersectPoint`)
            );
            return;
        }

        if (intersections.length > 0 && !areAllToolbarsHidden) {
            let intersectPoint = this.scene.getObjectByName(
                `${controller.uuid} intersectPoint`
            );

            // if there is currently no intersecting point for this controller
            if (!intersectPoint) {
                intersectPoint = this.createIntersectPoint();
                intersectPoint.name = `${controller.uuid} intersectPoint`;
            }

            this.scene.add(intersectPoint);
            const { x, y, z } = intersections[0].point;
            intersectPoint.position.x = x;
            intersectPoint.position.y = y;
            intersectPoint.position.z = z + 0.05;
            intersectPoint.needsUpdate = true;
        }

        return intersections;
    }

    hideToolbars() {
        if (!this.scene.userData.isToolbarVisible) {
            this.scene.userData.isToolbarVisible = {};
        }
        this.mediaLayers.forEach((_layerObj, layerName) => {
            this.scene.userData.isToolbarVisible[layerName] = false;
        });
    }

    /**
     * Handles scene on resizing the window
     */
    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Adds a button to enable VR for supported devices
     */
    setupVR() {
        this.renderer.xr.enabled = true;

        this.controllers = this.buildControllers();
        for (let controller of this.controllers) {
            controller.addEventListener("disconnected", () => {
                this.scene.remove(this.toolbarGroup);
            });
        }

        const vrButton = new VRButton(this.renderer, {
            requiredFeatures: ["layers"],
            optionalFeatures: ["local-floor", "bounded-floor"],
        });
        document.body.appendChild(vrButton.domElement);
    }
}

export default App;
