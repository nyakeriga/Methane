// ================================================================
// Methane (CH4) Molecule - Three.js Editor Script
// Unit 5 Assignment
// ================================================================
//
// SETUP INSTRUCTIONS (follow EXACTLY):
//
// 1. Go to threejs.org/editor
// 2. File > New > confirm
// 3. Click PROJECT tab (top-right) > set Shadows to YES
//    and shadow type to PCFSoftShadowMap
// 4. Click SCENE tab > set Background to Custom, pick black
// 5. Menu: Add > Group
// 6. In the scene tree, click on the new "Group" to select it
// 7. In the right panel click SCRIPT tab
// 8. Click the NEW button > pick "update" from dropdown
// 9. Click EDIT to open the code editor
// 10. Press Ctrl+A to select all, then DELETE
// 11. Paste this ENTIRE script
// 12. WAIT 2 seconds for autosave
// 13. Close the code editor (click the X at top-right of editor)
// 14. Press the Play button (triangle at bottom)
//
// ================================================================

// Drag state variables - persist across frames
var isDragging = false;
var prevX = 0;
var prevY = 0;

// ================================================================
// INIT - runs once when Play is pressed
// ================================================================
function init() {

	// -- Camera Setup --
	// Position camera above and in front, looking down at molecule
	camera.position.set(0, 4.5, 9);
	camera.lookAt(new THREE.Vector3(0, 0.5, 0));

	// -- Ambient Light --
	// Soft fill light so no surface is completely dark
	var ambLight = new THREE.AmbientLight(0x404040, 0.8);
	scene.add(ambLight);

	// -- Main Directional Light (casts shadows) --
	// Simulates sunlight from upper-right
	var dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
	dirLight.position.set(5, 12, 7);
	dirLight.castShadow = true;
	dirLight.shadow.camera.left = -10;
	dirLight.shadow.camera.right = 10;
	dirLight.shadow.camera.top = 10;
	dirLight.shadow.camera.bottom = -10;
	dirLight.shadow.camera.near = 0.5;
	dirLight.shadow.camera.far = 50;
	dirLight.shadow.mapSize.width = 2048;
	dirLight.shadow.mapSize.height = 2048;
	scene.add(dirLight);

	// -- Fill Light (no shadows) --
	// Gentle light from the opposite side for depth
	var fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
	fillLight.position.set(-4, 6, -5);
	scene.add(fillLight);

	// -- Green Ground Plane --
	// Added to scene (NOT to this) so it stays fixed
	// Receives shadows from the molecule above
	var planeGeo = new THREE.PlaneGeometry(40, 40);
	var planeMat = new THREE.MeshStandardMaterial({
		color: 0x00aa00,
		roughness: 0.5,
		metalness: 0.1,
		side: 2
	});
	var plane = new THREE.Mesh(planeGeo, planeMat);
	plane.rotation.x = -Math.PI / 2;
	plane.position.y = -2.8;
	plane.receiveShadow = true;
	scene.add(plane);

	// -- Carbon Atom (Red, center of molecule) --
	var cGeo = new THREE.SphereGeometry(0.70, 32, 32);
	var cMat = new THREE.MeshStandardMaterial({
		color: 0xcc0000,
		roughness: 0.3,
		metalness: 0.2,
		emissive: 0x220000
	});
	var carbon = new THREE.Mesh(cGeo, cMat);
	carbon.castShadow = true;
	carbon.receiveShadow = true;
	this.add(carbon);

	// -- Tetrahedral Directions --
	// 4 unit vectors pointing to vertices of a regular tetrahedron
	// Bond angle is approximately 109.47 degrees
	var s2 = Math.sqrt(2);
	var s6 = Math.sqrt(6);
	var dirs = [];
	dirs[0] = new THREE.Vector3(0, 1, 0);
	dirs[1] = new THREE.Vector3(0, -1/3, (2*s2)/3);
	dirs[2] = new THREE.Vector3(-s6/3, -1/3, -s2/3);
	dirs[3] = new THREE.Vector3(s6/3, -1/3, -s2/3);

	// Bond length from carbon center to hydrogen center
	var bLen = 2.0;

	// -- Hydrogen Material (Blue) --
	var hMat = new THREE.MeshStandardMaterial({
		color: 0x0055ff,
		roughness: 0.3,
		metalness: 0.2,
		emissive: 0x000044
	});

	// -- Bond Material (White with gray emissive) --
	var bMat = new THREE.MeshStandardMaterial({
		color: 0xffffff,
		roughness: 0.4,
		metalness: 0.1,
		emissive: 0x888888
	});

	// -- Create 4 Hydrogen atoms and 4 Bond cylinders --
	var i;
	for (i = 0; i < 4; i++) {

		var d = dirs[i];

		// Hydrogen position along tetrahedral direction
		var hx = d.x * bLen;
		var hy = d.y * bLen;
		var hz = d.z * bLen;

		// Hydrogen sphere
		var hGeo = new THREE.SphereGeometry(0.42, 32, 32);
		var hAtom = new THREE.Mesh(hGeo, hMat);
		hAtom.position.set(hx, hy, hz);
		hAtom.castShadow = true;
		hAtom.receiveShadow = true;
		this.add(hAtom);

		// Bond cylinder connecting carbon to hydrogen
		// Positioned at midpoint, rotated to align with direction
		// Perpendicular to sphere surfaces, through their centers
		var bGeo = new THREE.CylinderGeometry(0.12, 0.12, bLen, 20);
		var bond = new THREE.Mesh(bGeo, bMat);
		bond.position.set(hx * 0.5, hy * 0.5, hz * 0.5);

		// Rotate cylinder to point along bond direction
		var up = new THREE.Vector3(0, 1, 0);
		var q = new THREE.Quaternion();
		q.setFromUnitVectors(up, d.clone().normalize());
		bond.quaternion.copy(q);
		bond.castShadow = true;
		bond.receiveShadow = true;
		this.add(bond);
	}

	// Raise molecule group above the ground plane
	this.position.y = 1.2;
}

// ================================================================
// UPDATE - runs every frame for animation
// Slowly auto-rotates the molecule on the Y axis
// ================================================================
function update() {
	if (!isDragging) {
		this.rotation.y += 0.006;
	}
}

// ================================================================
// MOUSE CONTROLS - drag to rotate the molecule
// Only rotates "this" (the molecule group)
// Plane and lights stay fixed in the scene
// ================================================================
function pointerdown(event) {
	isDragging = true;
	prevX = event.clientX;
	prevY = event.clientY;
}

function pointermove(event) {
	if (!isDragging) { return; }
	var dx = event.clientX - prevX;
	var dy = event.clientY - prevY;
	this.rotation.y += dx * 0.008;
	this.rotation.x += dy * 0.008;
	prevX = event.clientX;
	prevY = event.clientY;
}

function pointerup() {
	isDragging = false;
}
