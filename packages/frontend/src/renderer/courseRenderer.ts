import { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, PlaneGeometry, 
  MeshStandardMaterial, Mesh, SphereGeometry, Color, Object3D, Light, BoxGeometry, RingGeometry, CylinderGeometry, Group, DoubleSide, Clock } from 'three';
import type { Vector2D, CourseObject } from '../types/shared';
import { z } from 'zod';

const RenderOptionsSchema = z.object({
  shadows: z.boolean().optional(),
  antialias: z.boolean().optional(),
  backgroundColor: z.number().optional()
});

type RenderOptions = z.infer<typeof RenderOptionsSchema>;

export class CourseRenderer {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private ball: Mesh;
  private objects: Map<string, Object3D> = new Map();
  private animations: Map<string, () => void> = new Map();
  private clock: Clock;
  private ballPositions: Vector2D[] = [];
  private currentPositionIndex = 0;
  private isAnimating = false;

  constructor(container: HTMLElement, options: RenderOptions = {}) {
    // Setup scene
    this.scene = new Scene();
    this.scene.background = new Color(options.backgroundColor || 0x87ceeb); // Sky blue background

    // Setup camera
    this.camera = new PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 15, 15);
    this.camera.lookAt(0, 0, 0);

    // Setup renderer
    this.renderer = new WebGLRenderer({ antialias: options.antialias });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = options.shadows || false;
    container.appendChild(this.renderer.domElement);

    // Setup lighting
    this.setupLighting();

    // Create ground plane
    this.createGround();

    // Create ball
    this.ball = this.createBall();
    this.scene.add(this.ball);

    this.clock = new Clock();
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);
  }

  private createGround(): void {
    const groundGeometry = new PlaneGeometry(50, 50);
    const groundMaterial = new MeshStandardMaterial({ 
      color: 0x2e8b57,  // Sea green
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private createBall(): Mesh {
    const geometry = new SphereGeometry(0.1, 32, 32);
    const material = new MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.8
    });
    const ball = new Mesh(geometry, material);
    ball.castShadow = true;
    ball.position.y = 0.1; // Lift slightly above ground
    return ball;
  }

  renderCourse(course: CourseObject[]): void {
    // Clear existing objects
    this.objects.forEach(obj => this.scene.remove(obj));
    this.objects.clear();
    this.animations.clear();

    // Keep only permanent objects (ball, lights, ground)
    this.scene.children = this.scene.children.filter(
      child => child === this.ball || child instanceof Light || child.userData.permanent
    );

    // Render new objects
    course.forEach(object => {
      const mesh = this.createObject(object);
      if (mesh) {
        this.scene.add(mesh);
        this.objects.set(this.getObjectId(object), mesh);
      }
    });
  }

  private createObject(object: CourseObject): Object3D | null {
    switch (object.type) {
      case 'wall':
        return this.createWall(object);
      case 'hole':
        return this.createHole(object);
      case 'water':
        return this.createWater(object);
      case 'sand':
        return this.createSand(object);
      case 'boost':
        return this.createBoost(object);
      default:
        return null;
    }
  }

  private createWall(object: CourseObject): Mesh {
    const geometry = new BoxGeometry(
      object.dimensions.x,
      0.5,
      object.dimensions.y
    );
    const material = new MeshStandardMaterial({ 
      color: 0x808080,
      roughness: 0.7
    });
    const wall = new Mesh(geometry, material);
    wall.position.set(object.position.x, 0.25, object.position.y);
    wall.castShadow = true;
    wall.receiveShadow = true;
    return wall;
  }

  private createHole(object: CourseObject): Group {
    const group = new Group();

    // Hole rim
    const rimGeometry = new RingGeometry(0.15, 0.2, 32);
    const rimMaterial = new MeshStandardMaterial({ 
      color: 0x404040,
      side: DoubleSide
    });
    const rim = new Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.01;

    // Hole depth
    const holeGeometry = new CylinderGeometry(0.15, 0.15, 0.1, 32);
    const holeMaterial = new MeshStandardMaterial({ color: 0x000000 });
    const hole = new Mesh(holeGeometry, holeMaterial);
    hole.position.y = -0.05;

    group.add(rim, hole);
    group.position.set(object.position.x, 0, object.position.y);
    return group;
  }

  private createPowerUp(object: CourseObject): Group {
    const group = new Group();

    // Base
    const baseGeometry = new BoxGeometry(0.3, 0.1, 0.3);
    const baseMaterial = new MeshStandardMaterial({ 
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 0.5
    });
    const base = new Mesh(baseGeometry, baseMaterial);

    // Floating effect
    const animate = () => {
      base.position.y = 0.3 + Math.sin(Date.now() * 0.003) * 0.1;
      base.rotation.y += 0.02;
    };
    this.animations.set(this.getObjectId(object), animate);

    group.add(base);
    group.position.set(object.position.x, 0, object.position.y);
    return group;
  }

  private createWater(object: CourseObject): Mesh {
    const geometry = new PlaneGeometry(
      object.dimensions.x,
      object.dimensions.y
    );
    const material = new MeshStandardMaterial({ 
      color: 0x4444ff,
      transparent: true,
      opacity: 0.6
    });
    const water = new Mesh(geometry, material);
    water.rotation.x = -Math.PI / 2;
    water.position.set(object.position.x, 0.01, object.position.y);
    return water;
  }

  private createSand(object: CourseObject): Mesh {
    const geometry = new PlaneGeometry(
      object.dimensions.x,
      object.dimensions.y
    );
    const material = new MeshStandardMaterial({ 
      color: 0xf4d03f,
      roughness: 1
    });
    const sand = new Mesh(geometry, material);
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(object.position.x, 0.01, object.position.y);
    return sand;
  }

  private createBoost(object: CourseObject): Mesh {
    const geometry = new PlaneGeometry(
      object.dimensions.x,
      object.dimensions.y
    );
    const material = new MeshStandardMaterial({ 
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3
    });
    const boost = new Mesh(geometry, material);
    boost.rotation.x = -Math.PI / 2;
    boost.position.set(object.position.x, 0.01, object.position.y);
    return boost;
  }

  updateBallPosition(position: Vector2D): void {
    this.ball.position.x = position.x;
    this.ball.position.z = position.y;
  }

  public animateBall(positions: Vector2D[]): void {
    this.ballPositions = positions;
    this.currentPositionIndex = 0;
    this.isAnimating = true;
  }

  public animate(): void {
    const delta = this.clock.getDelta();
    
    if (this.isAnimating && this.ballPositions.length > 0) {
      // Move 60 positions per second
      this.currentPositionIndex = Math.min(
        this.currentPositionIndex + Math.floor(60 * delta),
        this.ballPositions.length - 1
      );
      
      const position = this.ballPositions[this.currentPositionIndex];
      this.ball.position.set(position.x, 0.1, position.y);
      
      if (this.currentPositionIndex >= this.ballPositions.length - 1) {
        this.isAnimating = false;
      }
    }

    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose(): void {
    // Dispose geometries and materials
    this.scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    // Clear animations
    this.animations.clear();

    // Dispose renderer
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private getObjectId(object: CourseObject): string {
    return `${object.type}-${object.position.x}-${object.position.y}`;
  }
} 