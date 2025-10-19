// ==================== الإعداد الأساسي ====================

const container = document.getElementById("canvasContainer");

// إنشاء المشهد
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// إنشاء الكاميرا
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(3, 3, 3);

// إنشاء الـ Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// ==================== الإضاءة ====================

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// إضافة ضوء نقطي إضافي
const pointLight = new THREE.PointLight(0xffffff, 0.5);
pointLight.position.set(-5, 5, -5);
scene.add(pointLight);

// ==================== Grid Helper (شبكة أرضية) ====================

const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
scene.add(gridHelper);

// ==================== كائن تجريبي (مكعب) ====================

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
    color: 0x0077ff,
    metalness: 0.3,
    roughness: 0.4
});
const cube = new THREE.Mesh(geometry, material);
cube.position.y = 0.5;
scene.add(cube);

// ==================== OrbitControls يدوياً ====================

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let cameraRotation = { x: 0, y: 0 };
let cameraDistance = 5;

renderer.domElement.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        cameraRotation.y += deltaX * 0.005;
        cameraRotation.x += deltaY * 0.005;

        cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x));

        previousMousePosition = { x: e.clientX, y: e.clientY };
    }
});

renderer.domElement.addEventListener('mouseup', () => {
    isDragging = false;
});

renderer.domElement.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    cameraDistance *= (1 + (e.deltaY > 0 ? zoomSpeed : -zoomSpeed));
    cameraDistance = Math.max(1, Math.min(50, cameraDistance));
});

// ==================== Object Management ====================

const sceneObjects = [];
const objectListDiv = document.getElementById('objectItems');

function addObjectToList(name, object) {
    const objectData = {
        name: name,
        object: object,
        visible: true,
        id: 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    };
    sceneObjects.push(objectData);
    updateObjectList();
}

function removeObjectFromList(id) {
    const index = sceneObjects.findIndex(obj => obj.id === id);
    if (index !== -1) {
        scene.remove(sceneObjects[index].object);
        sceneObjects.splice(index, 1);
        updateObjectList();
    }
}

function toggleObjectVisibility(id) {
    const objectData = sceneObjects.find(obj => obj.id === id);
    if (objectData) {
        objectData.visible = !objectData.visible;
        objectData.object.visible = objectData.visible;
        updateObjectList();
    }
}

function updateObjectList() {
    objectListDiv.innerHTML = '';

    sceneObjects.forEach(objData => {
        const item = document.createElement('div');
        item.className = 'object-item';
        item.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 6px; margin: 4px 0; background: rgba(255,255,255,0.1); border-radius: 4px;';

        const eyeBtn = document.createElement('button');
        eyeBtn.textContent = objData.visible ? '👁️' : '👁️‍🗨️';
        eyeBtn.title = objData.visible ? 'Hide' : 'Show';
        eyeBtn.style.cssText = 'background: none; border: none; cursor: pointer; font-size: 16px; padding: 2px 6px;';
        eyeBtn.onclick = () => toggleObjectVisibility(objData.id);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = objData.name;
        nameSpan.style.cssText = 'flex: 1; font-size: 13px; opacity: ' + (objData.visible ? '1' : '0.5');

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete';
        deleteBtn.style.cssText = 'background: none; border: none; cursor: pointer; font-size: 14px; padding: 2px 6px; opacity: 0.7;';
        deleteBtn.onclick = () => removeObjectFromList(objData.id);

        item.appendChild(eyeBtn);
        item.appendChild(nameSpan);
        item.appendChild(deleteBtn);
        objectListDiv.appendChild(item);
    });
}

// إضافة المكعب التجريبي للقائمة
addObjectToList('Cube (demo)', cube);

// ==================== UI Interactions ====================

const statusDiv = document.getElementById('status');
const btnPlane = document.getElementById('btn-plane');
const btnSpline = document.getElementById('btn-spline');
const fileInput = document.getElementById('fileInput');

btnPlane.addEventListener('click', () => {
    statusDiv.textContent = 'Status: Plane segmentation feature coming soon...';
});

btnSpline.addEventListener('click', () => {
    statusDiv.textContent = 'Status: Trajectory drawing feature coming soon...';
});

// ==================== File Loading ====================

function parseOBJ(text) {
    const vertices = [];
    const faces = [];
    const lines = text.split('\n');

    for (let line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts[0] === 'v') {
            vertices.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
        } else if (parts[0] === 'f') {
            const face = [];
            for (let i = 1; i < parts.length; i++) {
                face.push(parseInt(parts[i].split('/')[0]) - 1);
            }
            if (face.length >= 3) {
                for (let i = 1; i < face.length - 1; i++) {
                    faces.push(face[0], face[i], face[i + 1]);
                }
            }
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(faces);
    geometry.computeVertexNormals();

    return geometry;
}

// دالة بسيطة لتحميل PLY (ASCII format)
function parsePLY(buffer) {
    const text = new TextDecoder().decode(buffer);
    const lines = text.split('\n');

    let vertexCount = 0;
    let headerEnd = 0;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('element vertex')) {
            vertexCount = parseInt(lines[i].split(' ')[2]);
        }
        if (lines[i].includes('end_header')) {
            headerEnd = i + 1;
            break;
        }
    }

    const vertices = [];
    const colors = [];

    for (let i = headerEnd; i < headerEnd + vertexCount && i < lines.length; i++) {
        const parts = lines[i].trim().split(/\s+/);
        if (parts.length >= 3) {
            vertices.push(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
            if (parts.length >= 6) {
                colors.push(parseInt(parts[3]) / 255, parseInt(parts[4]) / 255, parseInt(parts[5]) / 255);
            }
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    if (colors.length > 0) {
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }

    return geometry;
}

// دالة لضبط حجم النموذج والكاميرا تلقائياً
function fitModelToView(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 2;
    const scale = targetSize / maxDim;
    model.scale.set(scale, scale, scale);

    model.position.sub(center.multiplyScalar(scale));
    model.position.y = 0.5;

    cameraDistance = targetSize * 3;
}

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    statusDiv.textContent = `Status: Loading ${file.name}...`;

    const reader = new FileReader();

    reader.onload = (event) => {
        try {
            let loadedModel = null;

            if (fileExtension === 'obj') {
                const objText = new TextDecoder().decode(event.target.result);
                const geometry = parseOBJ(objText);

                const material = new THREE.MeshStandardMaterial({
                    color: 0x0077ff,
                    metalness: 0.3,
                    roughness: 0.4
                });

                loadedModel = new THREE.Mesh(geometry, material);
                scene.add(loadedModel);

                addObjectToList(file.name, loadedModel);
                fitModelToView(loadedModel);

                statusDiv.textContent = `Status: Loaded ${file.name} (${geometry.attributes.position.count} vertices)`;

            } else if (fileExtension === 'ply') {
                const geometry = parsePLY(event.target.result);

                const material = new THREE.PointsMaterial({
                    size: 0.02,
                    vertexColors: geometry.attributes.color !== undefined
                });

                loadedModel = new THREE.Points(geometry, material);
                scene.add(loadedModel);

                addObjectToList(file.name, loadedModel);
                fitModelToView(loadedModel);

                statusDiv.textContent = `Status: Loaded ${file.name} (${geometry.attributes.position.count} points)`;

            } else {
                statusDiv.textContent = `Status: ${fileExtension.toUpperCase()} format not yet supported. Use OBJ or PLY.`;
                return;
            }

        } catch (error) {
            statusDiv.textContent = `Status: Error parsing ${file.name}`;
            console.error(error);
        }
    };

    reader.readAsArrayBuffer(file);
});

// ==================== حلقة التحديث ====================

function animate() {
    requestAnimationFrame(animate);

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    const x = cameraDistance * Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x);
    const y = cameraDistance * Math.sin(cameraRotation.x);
    const z = cameraDistance * Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x);

    camera.position.x = x;
    camera.position.y = y + 2;
    camera.position.z = z;
    camera.lookAt(0, 0.5, 0);

    renderer.render(scene, camera);
}
animate();

// ==================== ضبط الحجم ====================

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==================== Backend Integration ====================

const API_BASE_URL = 'http://localhost:5000';

// متغيرات لتتبع النقاط المختارة
let selectedPoints = [];
let selectionMode = null; // 'plane' أو 'spline'
let selectionMarkers = [];

// تفعيل اختيار النقاط
function enablePointSelection(mode) {
    selectionMode = mode;
    selectedPoints = [];
    clearSelectionMarkers();

    statusDiv.textContent = `Status: Click on points in the scene (${mode} mode)`;
    renderer.domElement.style.cursor = 'crosshair';
}

// مسح علامات الاختيار
function clearSelectionMarkers() {
    selectionMarkers.forEach(marker => scene.remove(marker));
    selectionMarkers = [];
}

// إضافة علامة عند النقطة المختارة
function addSelectionMarker(point) {
    const markerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({
        color: selectionMode === 'plane' ? 0xff0000 : 0x00ff00
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(point[0], point[1], point[2]);
    scene.add(marker);
    selectionMarkers.push(marker);
}

// معالج النقر على المشهد
renderer.domElement.addEventListener('click', (event) => {
    if (!selectionMode) return;

    // حساب موقع الماوس المعياري
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycasting
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // ابحث عن التقاطعات مع الكائنات
    const objects = sceneObjects.map(obj => obj.object).filter(obj => obj.visible);
    const intersects = raycaster.intersectObjects(objects, true);

    if (intersects.length > 0) {
        const point = intersects[0].point;
        const pointArray = [point.x, point.y, point.z];
        selectedPoints.push(pointArray);
        addSelectionMarker(pointArray);

        statusDiv.textContent = `Status: Selected ${selectedPoints.length} points`;
    }
});

// Plane Segmentation
btnPlane.addEventListener('click', async () => {
    if (selectionMode === 'plane') {
        // إرسال للـ Backend
        if (selectedPoints.length < 100) {
            statusDiv.textContent = 'Status: Please select more points (min 100 recommended)';
            return;
        }

        statusDiv.textContent = 'Status: Processing plane segmentation...';

        try {
            const response = await fetch(`${API_BASE_URL}/segment_plane`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    points: selectedPoints,
                    threshold: 0.05,
                    max_iterations: 1000
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // رسم المستوى
            drawPlane(data.plane);

            statusDiv.textContent = `Status: Found plane with ${data.num_inliers} inliers`;

            // إعادة تعيين
            selectionMode = null;
            renderer.domElement.style.cursor = 'default';

        } catch (error) {
            console.error('Error:', error);
            statusDiv.textContent = `Status: Error - ${error.message}`;
        }

    } else {
        // تفعيل وضع الاختيار
        enablePointSelection('plane');
    }
});

// Draw Trajectory (B-Spline)
btnSpline.addEventListener('click', async () => {
    if (selectionMode === 'spline') {
        // إرسال للـ Backend
        if (selectedPoints.length < 2) {
            statusDiv.textContent = 'Status: Please select at least 2 control points';
            return;
        }

        statusDiv.textContent = 'Status: Computing trajectory...';

        try {
            const response = await fetch(`${API_BASE_URL}/bspline`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    control_points: selectedPoints,
                    degree: 3,
                    num_samples: 100,
                    method: 'catmull-rom' // أو 'bspline'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // رسم المنحنى
            drawSpline(data.curve_points);

            statusDiv.textContent = `Status: Drew trajectory with ${data.num_points} points`;

            // إعادة تعيين
            selectionMode = null;
            renderer.domElement.style.cursor = 'default';

        } catch (error) {
            console.error('Error:', error);
            statusDiv.textContent = `Status: Error - ${error.message}`;
        }

    } else {
        // تفعيل وضع الاختيار
        enablePointSelection('spline');
    }
});

// رسم المستوى
function drawPlane(planeData) {
    const planeGeometry = new THREE.PlaneGeometry(5, 5);
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6b6b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
    });

    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);

    // ضع المستوى في الموقع الصحيح
    const normal = new THREE.Vector3(...planeData.normal);
    const point = new THREE.Vector3(...planeData.point);

    planeMesh.position.copy(point);
    planeMesh.lookAt(point.clone().add(normal));

    scene.add(planeMesh);
    addObjectToList('Segmented Plane', planeMesh);

    clearSelectionMarkers();
}

// رسم المنحنى
function drawSpline(curvePoints) {
    const points = curvePoints.map(p => new THREE.Vector3(p[0], p[1], p[2]));

    const curveGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const curveMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 3
    });

    const curveLine = new THREE.Line(curveGeometry, curveMaterial);

    scene.add(curveLine);
    addObjectToList('Trajectory', curveLine);

    clearSelectionMarkers();
}