///////////////////////////////////////////////////
///  toolbox
///  yanzhe, Nov. 16 2015
///////////////////////////////////////////////////

function setOrthographic() {
	var timer = Date.now() * 0.0001;
	camera.toOrthographic();
	document.getElementById('fov').innerHTML = 'Orthographic mode' ;
}

function setPerspective() {
	camera.toPerspective();
	document.getElementById('fov').innerHTML = 'Perspective mode' ;
}

function setPointLight() {
	var spot = scene.children[1];
	var dir = scene.children[2];
	spot.castShadow = true;
	dir.castShadow = false;
	dir.intensity = 0.5;

	var arrowHelper1 = scene.children[5];
	var arrowHelper2 = scene.children[6];
	var arrowHelper3 = scene.children[7];
	arrowHelper1.visible = false;
	arrowHelper2.visible = false;
	arrowHelper3.visible = false;

	var lightSphere = scene.children[8];
	var lightHolder = scene.children[9];
	lightSphere.visible = true;
	lightHolder.visible = true;
}

function setDirectionalLight() {
	var spot = scene.children[1];
	var dir = scene.children[2];
	spot.castShadow = false;
	dir.castShadow = true;
	dir.intensity = 1;

	var arrowHelper1 = scene.children[5];
	var arrowHelper2 = scene.children[6];
	var arrowHelper3 = scene.children[7];
	arrowHelper1.visible = true;
	arrowHelper2.visible = true;
	arrowHelper3.visible = true;

	var lightSphere = scene.children[8];
	var lightHolder = scene.children[9];
	lightSphere.visible = false;
	lightHolder.visible = false;
}

function addTexture(){
	var object =  scene.getObjectByName("mesh");
	object.traverse( function ( child ) {
		if ( child instanceof THREE.Mesh ) {
			child.castShadow = true;
			child.material.map = texture;
		}
	});
}

function removeTexture() {
	var object =  scene.getObjectByName("mesh");
	object.traverse( function ( child ) {
		if ( child instanceof THREE.Mesh ) {
			child.castShadow = true;
			child.material.map = null;
		}
	} );
}