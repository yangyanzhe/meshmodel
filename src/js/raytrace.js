///////////////////////////////////////////////////
///  rayTrace
///  yanzhe, Nov. 16 2015
///  Reference: threejs.org example/js/renderer/RaytracingRenderer.js
///////////////////////////////////////////////////

var cameraPosition = new THREE.Vector3();
var cameraNormalMatrix  = new THREE.Matrix3();
var cameraInverseMatrix = new THREE.Matrix4();
var origin = new THREE.Vector3();
var direction = new THREE.Vector3();
var raycaster = new THREE.Raycaster( origin, direction );
var raycasterLight = new THREE.Raycaster();

var lights = [];
var cache = {};
var objects = scene.children;
var modelViewMatrix = new THREE.Matrix4();

var width, height;
var halfWidth, halfHeight;
var perspective;

function raytrace() {
	var canvas = document.getElementsByTagName("canvas")[0];
	width = canvas.width;
	height = canvas.height;
	halfWidth = width / 2;
	halfHeight = height / 2;
	context.clearRect(0, 0, canvas.width, canvas.height);
	cancelAnimationFrame( requestID );

	// get camera position
	cameraPosition.setFromMatrixPosition( camera.matrixWorld );
	cameraNormalMatrix.getNormalMatrix( camera.matrixWorld ); 
	camera.matrixWorldInverse.getInverse( camera.matrixWorld );
	cameraInverseMatrix = camera.matrixWorldInverse.clone();
	perspective = 0.5 / Math.tan( THREE.Math.degToRad( camera.fov * 0.5 ) ) * canvasHeight;

	// get light and objects
	scene.traverse(function (object) {
		if(object instanceof THREE.light) {
			lights.push(object);
		}

		if ( cache[ object.id ] === undefined ) {
			cache[ object.id ] = {
				normalMatrix: new THREE.Matrix3(),
				inverseMatrix: new THREE.Matrix4()
			};
		}

		modelViewMatrix.multiplyMatrices( cameraInverseMatrix, object.matrixWorld );
		cache[object.id].normalMatrix.getNormalMatrix(modelViewMatrix);
		cache[object.id].inverseMatrix.getInverse(object.matrix);
	});

	// render from (0,0)
	iterateRender(0,0);
}

function iterateRender(rX, rY) {
	var size = 64;
	var canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	var context = canvas.getContext('2d', {alpha:false})
	var image = context.getImageData(0, 0, size, size);
	var data = imagedata.data;
	var pixelColor = new THREE.Color();


	var index = 0;
	for ( var y = 0; y < blockSize; y ++ ) {
		for ( var x = 0; x < blockSize; x ++, index += 4 ) {
			origin.copy( cameraPosition );
			direction.set( x + rX - halfWidth, - ( y + rY - halfHeight ), - perspective );
			direction.applyMatrix3( cameraNormalMatrix ).normalize();
			calculateColor( origin, direction, pixelColor, 0 );

			data[ index ]     = Math.sqrt( pixelColor.r ) * 255;
			data[ index + 1 ] = Math.sqrt( pixelColor.g ) * 255;
			data[ index + 2 ] = Math.sqrt( pixelColor.b ) * 255;

		}
	}

	context.putImageData( image, rX, rY );

	rX += blockSize;
	if ( rX >= width ) {
		rX = 0;
		rY += blockSize;
		if ( rY >= canvasHeight ) {
			scope.dispatchEvent( { type: "complete" } );
			return;
		}
	}

	context.fillRect( rX, rY, size, size );

	animationFrameId = requestAnimationFrame( function () {
		iterateRender( rX, rY );
	} );
}

function calculateColor(rayOrigin, rayDirection, outputColor, recursionDepth ) {

	var diffuseColor = new THREE.Color();
	var specularColor = new THREE.Color();
	var lightColor = new THREE.Color();
	var schlick = new THREE.Color();

	var lightContribution = new THREE.Color();

	var eyeVector = new THREE.Vector3();
	var lightVector = new THREE.Vector3();
	var normalVector = new THREE.Vector3();
	var halfVector = new THREE.Vector3();

	var localPoint = new THREE.Vector3();
	var reflectionVector = new THREE.Vector3();

	var tmpVec = new THREE.Vector3();

	var tmpColor = [];

	for ( var i = 0; i < maxRecursionDepth; i ++ ) {

		tmpColor[ i ] = new THREE.Color();

	}

	var ray = raycaster.ray;
	ray.origin = rayOrigin;
	ray.direction = rayDirection;
	var rayLight = raycasterLight.ray;
	outputColor.setRGB( 0, 0, 0 );
	
	// calculate intersections
	var intersections = raycaster.intersectObjects( objects, true );
	if ( intersections.length === 0 ) {  return; }

	// ray hit
	var intersection = intersections[ 0 ];
	var point = intersection.point;
	var object = intersection.object;
	var material = object.material;
	var face = intersection.face;
	var vertices = object.geometry.vertices;


	var cacheObject = cache[ object.id ];
	localPoint.copy( point ).applyMatrix4( cacheObject.inverseMatrix );
	eyeVector.subVectors( raycaster.ray.origin, point ).normalize();

	// resolve pixel diffuse color
	diffuseColor.copyGammaToLinear( material.color );

	// compute light shading
	rayLight.origin.copy( point );
	var normalComputed = false;
	for ( var i = 0, l = lights.length; i < l; i ++ ) {
		var light = lights[ i ];
		lightColor.copyGammaToLinear( light.color );
		lightVector.setFromMatrixPosition( light.matrixWorld );
		lightVector.sub( point );

		rayLight.direction.copy( lightVector ).normalize();
		var intersections = raycasterLight.intersectObjects( objects, true );

		// point in shadow
		if ( intersections.length > 0 ) continue;

		// point lit
		if ( normalComputed == false ) {
			// the same normal can be reused for all lights
			// (should be possible to cache even more)

			computePixelNormal( normalVector, localPoint, material.shading, face, vertices );
			normalVector.applyMatrix3( cacheObject.normalMatrix ).normalize();
			normalComputed = true;

		}

		lightVector.normalize();

		// compute diffuse
		var dot = Math.max( normalVector.dot( lightVector ), 0 );
		var diffuseIntensity = dot * light.intensity;

		lightContribution.copy( diffuseColor );
		lightContribution.multiply( lightColor );
		lightContribution.multiplyScalar( diffuseIntensity * attenuation );
		outputColor.add( lightContribution );

		// compute specular
		halfVector.addVectors( lightVector, eyeVector ).normalize();

		var dotNormalHalf = Math.max( normalVector.dot( halfVector ), 0.0 );
		var specularIntensity = Math.max( Math.pow( dotNormalHalf, material.shininess ), 0.0 ) * diffuseIntensity;

		var specularNormalization = ( material.shininess + 2.0 ) / 8.0;

		specularColor.copyGammaToLinear( material.specular );

		var alpha = Math.pow( Math.max( 1.0 - lightVector.dot( halfVector ), 0.0 ), 5.0 );

		schlick.r = specularColor.r + ( 1.0 - specularColor.r ) * alpha;
		schlick.g = specularColor.g + ( 1.0 - specularColor.g ) * alpha;
		schlick.b = specularColor.b + ( 1.0 - specularColor.b ) * alpha;

		lightContribution.copy( schlick );

		lightContribution.multiply( lightColor );
		lightContribution.multiplyScalar( specularNormalization * specularIntensity * attenuation );
		outputColor.add( lightContribution );
	} // end every lights

	// reflection / refraction

	var reflectivity = material.reflectivity;

	if ( ( material.mirror || material.glass ) && reflectivity > 0 && recursionDepth < maxRecursionDepth ) {

		if ( material.mirror ) {

			reflectionVector.copy( rayDirection );
			reflectionVector.reflect( normalVector );

		} else if ( material.glass ) {

			var eta = material.refractionRatio;

			var dotNI = rayDirection.dot( normalVector );
			var k = 1.0 - eta * eta * ( 1.0 - dotNI * dotNI );

			if ( k < 0.0 ) {

				reflectionVector.set( 0, 0, 0 );

			} else {

				reflectionVector.copy( rayDirection );
				reflectionVector.multiplyScalar( eta );

				var alpha = eta * dotNI + Math.sqrt( k );
				tmpVec.copy( normalVector );
				tmpVec.multiplyScalar( alpha );
				reflectionVector.sub( tmpVec );

			}

		}

		var theta = Math.max( eyeVector.dot( normalVector ), 0.0 );
		var rf0 = reflectivity;
		var fresnel = rf0 + ( 1.0 - rf0 ) * Math.pow( ( 1.0 - theta ), 5.0 );

		var weight = fresnel;

		var zColor = tmpColor[ recursionDepth ];

		spawnRay( point, reflectionVector, zColor, recursionDepth + 1 );

		if ( material.specular !== undefined ) {

			zColor.multiply( material.specular );

		}

		zColor.multiplyScalar( weight );
		outputColor.multiplyScalar( 1 - weight );
		outputColor.add( zColor );

	}

};
