///////////////////////////////////////////////////
///  reander.js
///  yanzhe, Nov. 16 2015
///////////////////////////////////////////////////

var container;
var camera, scene, renderer, sunLight;
var lookAtScene = true;
var cameraInitZ = 200;

var mousePressed = false;
var mouseX = 0, mouseY = 0;
var zoom = 0.5;
var translateX = 0, translateY = 0, translateZ = 0;
var positionX = 80, positionY = 20, positionZ = 80;
var cameraDX = 200, cameraDY = 100, cameraDZ = 200;
var spotX = 140, spotY = 100, spotZ = 160;
var dirX = 50, dirY = 60, dirZ = -50;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var dirLight, spotLight;
var manager;
var requestID;
var textureFile = 'data/UV_Grid_Sm.jpg';
var objectFile = 'data/male02.obj';
var texture;

var raytraceFlag = false;

function init() {
	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

	container = document.createElement( 'div' );
	container.class = "display";
	document.body.appendChild( container );

	initScene();
	initGeometry();

	renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	container.appendChild( renderer.domElement );

	window.addEventListener('resize', onWindowResize, false );
	document.addEventListener('mousemove', onDocumentMouseMove, false );
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('mousedown', onMouseDown, false);
	document.addEventListener('mouseup', onMouseUp, false);
	document.addEventListener('wheel', onWheel, false);
}

function initScene() {
	camera = new THREE.CombinedCamera(window.innerWidth / 2, window.innerHeight / 2, 45, 1, 1000, -500, 1000);
	camera.position.x = cameraDX;
	camera.position.y = cameraDY;
	camera.position.z = cameraDZ;
	camera.zoom = 1;
	camera.updateProjectionMatrix();
	scene = new THREE.Scene();

	// Lights
	scene.add( new THREE.AmbientLight( 0x404040 ) );
	
	spotLight = new THREE.SpotLight( 0xf0f0f0 );
	spotLight.name = 'Spot Light';
	spotLight.position.set( spotX, spotY, spotZ );
	spotLight.castShadow = false;
	spotLight.intensity = 1;
	spotLight.angle = Math.PI * 2;
	//spotLight.shadowDarkness = 0.5;
	spotLight.shadowCameraNear = 8;
	spotLight.shadowCameraFar = 3000;
	spotLight.shadowMapWidth = 2000;
	spotLight.shadowMapHeight = 2000;
	scene.add( spotLight );

	dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
	dirLight.name = 'Dir. Light';
	dirLight.position.set( dirX, dirY, dirZ );
	dirLight.castShadow = true;
	dirLight.intensity = 1;
	dirLight.shadowCameraNear = 1;
	dirLight.shadowCameraFar = 1000;
	dirLight.shadowCameraRight = 300;
	dirLight.shadowCameraLeft = -300;
	dirLight.shadowCameraTop	= 300;
	dirLight.shadowCameraBottom = -300;

	dirLight.shadowMapWidth = 1024;
	dirLight.shadowMapHeight = 1024;
	scene.add( dirLight );

	var size = 200, step = 50;
	var geoLine = new THREE.Geometry();
	for ( var i = - size; i <= size; i += step ) {
		geoLine.vertices.push( new THREE.Vector3( - size, 0, i ) );
		geoLine.vertices.push( new THREE.Vector3(   size, 0, i ) );

		geoLine.vertices.push( new THREE.Vector3( i, 0, - size ) );
		geoLine.vertices.push( new THREE.Vector3( i, 0,   size ) );
	}
	var matLine = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } );
	var line = new THREE.LineSegments( geoLine, matLine );
	scene.add( line );

	var geometry = new THREE.BoxGeometry( 200, 5, 200 );
	var material = new THREE.MeshPhongMaterial( {
		color: 0xa0adaf,
		shininess: 150,
		specular: 0xffffff,
		shading: THREE.SmoothShading
	} );
	var ground = new THREE.Mesh( geometry, material );
	ground.position.x = 50;
	ground.position.y = 20;
	ground.position.z = 50;
	ground.castShadow = false;
	ground.receiveShadow = true;
	scene.add( ground );

	// arrows

	var arrowHelper1, arrowHelper2, arrowHelper3;
	var arrowDirection = new THREE.Vector3();
	var arrowPosition1 = new THREE.Vector3();
	var arrowPosition2 = new THREE.Vector3();
	var arrowPosition3 = new THREE.Vector3();
	arrowDirection.subVectors( scene.position, dirLight.position ).normalize();

	arrowPosition1.copy( dirLight.position );
	arrowHelper1 = new THREE.ArrowHelper( arrowDirection, arrowPosition1, 10, 0x00a2e8, 3, 2 );
	scene.add( arrowHelper1 );

	arrowPosition2.copy( dirLight.position ).add( new THREE.Vector3( 6, 0, 0 ) );
	arrowHelper2 = new THREE.ArrowHelper( arrowDirection, arrowPosition2, 10, 0x00a2e8, 3, 2 );
	scene.add( arrowHelper2 );

	arrowPosition3.copy( dirLight.position ).add( new THREE.Vector3( -6, 0, 0 ) );
	arrowHelper3 = new THREE.ArrowHelper( arrowDirection, arrowPosition3, 10, 0x00a2e8, 3, 2 );
	scene.add( arrowHelper3 );

	// LIGHTBULB
	var lightSphereGeometry = new THREE.SphereGeometry( 1 );
	var lightSphereMaterial = new THREE.MeshBasicMaterial( { color: 'rgb(255,201,14)' } );
	lightSphere = new THREE.Mesh( lightSphereGeometry, lightSphereMaterial );
	lightSphere.position.copy(spotLight.position);
	scene.add( lightSphere );

	var lightHolderGeometry = new THREE.CylinderGeometry( 0.5, 0.5, 2.5 );
	var lightHolderMaterial = new THREE.MeshBasicMaterial( { color: 'rgb(75,75,75)' } );
	lightHolder = new THREE.Mesh( lightHolderGeometry, lightHolderMaterial );
	lightHolder.position.copy(spotLight.position);
	lightHolder.position.y += 2;
	scene.add( lightHolder );

	lightSphere.visible = false;
	lightHolder.visible = false;

	// sphere
	var mirrorMaterialFlat = new THREE.MeshPhongMaterial( {
		color: 0x000000,
		specular: 0xff8888,
		shininess: 10000,
		vertexColors: THREE.NoColors,
		shading: THREE.FlatShading
	} );
	mirrorMaterialFlat.mirror = true;
	mirrorMaterialFlat.reflectivity = 1;

	var planeGeometry = new THREE.BoxGeometry( 60, 60, 60 );
	var box = new THREE.Mesh( planeGeometry, mirrorMaterialFlat );
	box.castShadow = true;
	box.receiveShadow = true;
	box.scale.multiplyScalar( 0.5 );
	box.position.set( 10, 40, 50 );
	scene.add( box );
}

function initGeometry() {
	manager = new THREE.LoadingManager();
	
	manager.onProgress = function ( item, loaded, total ) {
		console.log( item, loaded, total );
	};
	var onProgress = function ( xhr ) {
		if ( xhr.lengthComputable ) {
			var percentComplete = xhr.loaded / xhr.total * 100;
			console.log( Math.round(percentComplete, 2) + '% downloaded' );
		}
	};
	var onError = function ( xhr ) { };
	
	/*
	texture = new THREE.Texture();
	var loader = new THREE.ImageLoader( manager );
	loader.load( textureFile, function ( image ) {
		texture.image = image;
		texture.needsUpdate = true;
		var material =  new THREE.MeshPhongMaterial( { 
			//map: texture,
			color: 0xf0f0f0, 
			emissive: 0x000000, 
			specular: 0x111111, 
			shininess: 30, 
			shading: THREE.SmoothShading,
			wireframe: false,
			vertexColors: THREE.NoColors
		});

		var loadModel = new THREE.OBJLoader( manager );
		//loader.load( 'data/elephant[16134f].obj', function ( object ) {
		loadModel.load( objectFile, function ( object ) {
			object.traverse( function ( child ) {
				if ( child instanceof THREE.Mesh ) {
					//
					geometry = new THREE.Geometry().fromBufferGeometry( child.geometry );
					geometry.mergeVertices();
					geometry.computeVertexNormals(); 
					geometry.center();
					mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial({map: texture}));
					mesh.position.y = positionY;
					mesh.castShadow = true;
					mesh.receiveShadow =false;
					mesh.name = "mesh";
					scene.add(mesh);//

					child.castShadow = true;
					child.material = material;
					child.material.map.src = textureFile;
					//child.material = new THREE.MeshLambertMaterial({map:texture});
				}
				object.position.y = positionY;
				object.position.x = positionX;
				object.position.z = positionZ;
				object.name = "mesh";
				scene.add(object);
			} );
		}, onProgress, onError );
	} );	
*/

	var textureLoader = new THREE.TextureLoader();
	textureLoader.load(textureFile, function(image) {
		texture = image;
		var object =  scene.getObjectByName("mesh");
		var material =  new THREE.MeshPhongMaterial( { 
			map: texture,
			color: 0xf0f0f0, 
			emissive: 0x000000, 
			specular: 0x111111, 
			shininess: 30, 
			shading: THREE.SmoothShading,
			wireframe: false,
			vertexColors: THREE.NoColors
		});

		var count = 0;
		var loadModel = new THREE.OBJLoader( manager );
		loadModel.load( objectFile, function ( object ) {
			object.traverse( function ( child ) {
				if ( child instanceof THREE.Mesh ) {
					child.castShadow = true;
					child.receiveShadow = false;
					child.material = material;
					child.material.map = texture;
				}
				object.position.y = positionY;
				object.position.x = positionX;
				object.position.z = positionZ;
				object.name = "mesh";
				scene.add(object);
			});
		}, onProgress, onError );
	});
}

function render() {
	//var mesh = scene.children[ 10 ];
	var object =  scene.getObjectByName("mesh");
	if(object != undefined) {
		var radius = mouseX * 2 / windowHalfX * Math.PI + Math.PI;
		object.rotation.y = radius * 1.2;
		object.scale.set(zoom, zoom, zoom);
		object.position.x = positionX;
		object.position.y = positionY;
		object.position.z = positionZ;
		//mesh.geometry.translate(translateX, translateY, translateZ);
	}
	//camera.position.x = positionX;
	//camera.position.y = positionY;

	camera.position.x = cameraDX;
	camera.position.y = cameraDY;
	camera.lookAt( scene.position );
	renderer.render( scene, camera );
}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseMove( event ) {
	// mouseX range [-windowHalfX, windowHalfX]
	if(mousePressed) {
		mouseX = ( event.clientX - windowHalfX ) / 2;
		mouseY = ( event.clientY - windowHalfY ) / 2;
	}
}

function onKeyDown(event) {
	switch(event.keyCode) {
		case 37: translateX -= 0.2;
				 positionX -= 1;
			break;
		case 38: positionZ += 1;
			break;
		case 39: translateX += 0.2;
				 positionX += 1;
			break;
		case 40: positionZ -= 1;
			break;
		case 107: translateY -= 0.2;
				  positionY -= 1;
			break;
		case 109: translateY += 0.2;
				  positionY += 1;
			break;
		case 32: if(!raytraceFlag) { raytrace(); raytraceFlag=true;}
				 else {
				 	var canvas = document.getElementsByTagName("canvas")[0];
				 	canvas.remove();
				 	init();
				 	animate();
				 	
				 	raytraceFlag=false;
				 }
			break;
	} 	
}

function onMouseDown(event) {
	mousePressed = true;
}

function onMouseUp(event) {
	mousePressed = false;
}

function onWheel(event) {
	zoom *= (1 + event.deltaY / 1000);
}

function animate() {
	requestID = requestAnimationFrame( animate );
	render();
}
