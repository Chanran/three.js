import { Quaternion } from '../math/Quaternion.js';
import { Vector3 } from '../math/Vector3.js';
import { Matrix4 } from '../math/Matrix4.js';
import { EventDispatcher } from './EventDispatcher.js';
import { Euler } from '../math/Euler.js';
import { Layers } from './Layers.js';
import { Matrix3 } from '../math/Matrix3.js';
import { _Math } from '../math/Math.js';

/**
 * @author mrdoob / http://mrdoob.com/
 * @author mikael emtinger / http://gomo.se/
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author elephantatwork / www.elephantatwork.ch
 */

var object3DId = 0;

function Object3D() {

	Object.defineProperty( this, 'id', { value: object3DId ++ } ); // 3d对象的id

	this.uuid = _Math.generateUUID(); // 生成3d对象的uuid

	this.name = '';  // 3d对象的名称
	this.type = 'Object3D'; // 3d对象的类型

	this.parent = null; // 3d对象的父对象
	this.children = []; // 3d对象的子对象

	this.up = Object3D.DefaultUp.clone(); // 3d对象的上方向

	var position = new Vector3(); // 新建了一个Vector3(向量)对象作为3d对象的位置参数
	var rotation = new Euler();  // 新建了一个Euler(欧拉)对象作为3d对象的默认旋转参数
	var quaternion = new Quaternion(); // 新建了一个Quaternion(四元素)对象作为3d对象的四元素参数
	var scale = new Vector3( 1, 1, 1 ); // 新建一个vector3作为3d对象的缩放参数

	function onRotationChange() {

		quaternion.setFromEuler( rotation, false );

	}

	function onQuaternionChange() {

		rotation.setFromQuaternion( quaternion, undefined, false );

	}

	rotation.onChange( onRotationChange ); // 当rotation对象被改变的时候，触发onRotationChange函数，也就是同时改变quaternion的值
	quaternion.onChange( onQuaternionChange ); // 当quaternion对象被改变的时候，触发onQuaternionChange函数，也就是同时改变rotation的值

	Object.defineProperties( this, {  // 定义position、rotation、quaternion可枚举属性
		position: {
			enumerable: true,
			value: position
		},
		rotation: {
			enumerable: true,
			value: rotation
		},
		quaternion: {
			enumerable: true,
			value: quaternion
		},
		scale: {
			enumerable: true,
			value: scale
		},
		modelViewMatrix: {			// 等同于 this.modelViewMatrix = new Matrix4()
			value: new Matrix4()
		},
		normalMatrix: {
			value: new Matrix3()  // 等同于 this.normalMatrix = new Matrix3()
		}
	} );

	this.matrix = new Matrix4();			// 局部坐标系变换矩阵
	this.matrixWorld = new Matrix4(); // 世界坐标系变换矩阵, 直接从当前局部坐标系的变换到世界坐标系的矩阵

	this.matrixAutoUpdate = Object3D.DefaultMatrixAutoUpdate; // 自动更新局部
	this.matrixWorldNeedsUpdate = false; // 是否需要更新世界坐标系的变换矩阵

	this.layers = new Layers(); //
	this.visible = true; // 设置这个object3d对象是否可见

	this.castShadow = false; // 是否可以被渲染到阴影图哩
	this.receiveShadow = false; // 是否接收阴影

	this.frustumCulled = true; // 每帧检测这个object3D对象是否在camera的视锥体内 
	this.renderOrder = 0; // 渲染顺序

	this.userData = {};

}

Object3D.DefaultUp = new Vector3( 0, 1, 0 ); // 默认上方向
Object3D.DefaultMatrixAutoUpdate = true;     // 默认自动更新局部坐标系矩阵

Object3D.prototype = Object.assign( Object.create( EventDispatcher.prototype ), {

	constructor: Object3D,

	isObject3D: true,

	onBeforeRender: function () {}, // 渲染之前的钩子函数
	onAfterRender: function () {},  // 渲染之后的钩子函数

	/**
	 * 当前的object3d对象的this.matrix乘上matrix矩阵
	 * 调用this.matrix自带的矩阵乘法函数mutiplyMatrices相乘，然后改变当前this.matrix
	 * 调用this.matrix.decompose将变化后的this.matrix映射到this.position,this.quaternion,this.scale
	 * 
	 * @param {Matrix} matrix 矩阵
	 */
	applyMatrix: function ( matrix ) {

		this.matrix.multiplyMatrices( matrix, this.matrix );

		this.matrix.decompose( this.position, this.quaternion, this.scale );

	},

	/**
	 * 当前的object3d对象this.quaternion乘上quaternion四元素
	 * 调用this.quaternion自带的premultiply，然后改变当前this.quaternion
	 * 
	 * @param {Quaternion} q 四元素
	 */
	applyQuaternion: function ( q ) {

		this.quaternion.premultiply( q );

		return this;

	},


	/**
	 * 绕某个旋转轴旋转一定的弧度
	 * 
	 * @param {Vector3} axis 绕着旋转的某个旋转轴
	 * @param {number} angle 弧度
	 */
	setRotationFromAxisAngle: function ( axis, angle ) {

		// assumes axis is normalized

		this.quaternion.setFromAxisAngle( axis, angle );

	},

	
	/**
	 * 根据欧拉角旋转
	 * 
	 * @param {Euler} euler 欧拉角
	 */
	setRotationFromEuler: function ( euler ) {

		this.quaternion.setFromEuler( euler, true );

	},

	/**
	 * 根据矩阵旋转
	 * 
	 * @param {Matrix4} m 矩阵
	 */
	setRotationFromMatrix: function ( m ) {

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		this.quaternion.setFromRotationMatrix( m );

	},

	/**
	 * 根据四元素旋转
	 * 
	 * @param {Quaternion} q 四元素
	 */
	setRotationFromQuaternion: function ( q ) {

		// assumes q is normalized

		this.quaternion.copy( q );

	},

	/**
	 * 绕某个旋转轴旋转一定的弧度
	 * 
	 * 这里使用了闭包来实现单例模式，每次执行rotateOnAxis的时候都只用一开始创建的q1四元素做中转站
	 * 
	 * @param {Vector3} axis 绕着旋转的某个旋转轴
	 * @param {number} angle 弧度
	 */
	rotateOnAxis: function () {

		// rotate object on axis in object space
		// axis is assumed to be normalized

		var q1 = new Quaternion();

		return function rotateOnAxis( axis, angle ) {

			q1.setFromAxisAngle( axis, angle );

			this.quaternion.multiply( q1 );

			return this;

		};

	}(),

	rotateOnWorldAxis: function () {

		// rotate object on axis in world space
		// axis is assumed to be normalized
		// method assumes no rotated parent

		var q1 = new Quaternion();

		return function rotateOnWorldAxis( axis, angle ) {

			q1.setFromAxisAngle( axis, angle );

			this.quaternion.premultiply( q1 );

			return this;

		};

	}(),

	rotateX: function () {

		var v1 = new Vector3( 1, 0, 0 );

		return function rotateX( angle ) {

			return this.rotateOnAxis( v1, angle );

		};

	}(),

	rotateY: function () {

		var v1 = new Vector3( 0, 1, 0 );

		return function rotateY( angle ) {

			return this.rotateOnAxis( v1, angle );

		};

	}(),

	rotateZ: function () {

		var v1 = new Vector3( 0, 0, 1 );

		return function rotateZ( angle ) {

			return this.rotateOnAxis( v1, angle );

		};

	}(),

	translateOnAxis: function () {

		// translate object by distance along axis in object space
		// axis is assumed to be normalized

		var v1 = new Vector3();

		return function translateOnAxis( axis, distance ) {

			v1.copy( axis ).applyQuaternion( this.quaternion );

			this.position.add( v1.multiplyScalar( distance ) );

			return this;

		};

	}(),

	translateX: function () {

		var v1 = new Vector3( 1, 0, 0 );

		return function translateX( distance ) {

			return this.translateOnAxis( v1, distance );

		};

	}(),

	translateY: function () {

		var v1 = new Vector3( 0, 1, 0 );

		return function translateY( distance ) {

			return this.translateOnAxis( v1, distance );

		};

	}(),

	translateZ: function () {

		var v1 = new Vector3( 0, 0, 1 );

		return function translateZ( distance ) {

			return this.translateOnAxis( v1, distance );

		};

	}(),

	localToWorld: function ( vector ) {

		return vector.applyMatrix4( this.matrixWorld );

	},

	worldToLocal: function () {

		var m1 = new Matrix4();

		return function worldToLocal( vector ) {

			return vector.applyMatrix4( m1.getInverse( this.matrixWorld ) );

		};

	}(),

	lookAt: function () {

		// This method does not support objects with rotated and/or translated parent(s)

		var m1 = new Matrix4();
		var vector = new Vector3();

		return function lookAt( x, y, z ) {

			if ( x.isVector3 ) {

				vector.copy( x );

			} else {

				vector.set( x, y, z );

			}

			if ( this.isCamera ) {

				m1.lookAt( this.position, vector, this.up );

			} else {

				m1.lookAt( vector, this.position, this.up );

			}

			this.quaternion.setFromRotationMatrix( m1 );

		};

	}(),

	add: function ( object ) {

		if ( arguments.length > 1 ) {

			for ( var i = 0; i < arguments.length; i ++ ) {

				this.add( arguments[ i ] );

			}

			return this;

		}

		if ( object === this ) {

			console.error( "THREE.Object3D.add: object can't be added as a child of itself.", object );
			return this;

		}

		if ( ( object && object.isObject3D ) ) {

			if ( object.parent !== null ) {

				object.parent.remove( object );

			}

			object.parent = this;
			object.dispatchEvent( { type: 'added' } );

			this.children.push( object );

		} else {

			console.error( "THREE.Object3D.add: object not an instance of THREE.Object3D.", object );

		}

		return this;

	},

	remove: function ( object ) {

		if ( arguments.length > 1 ) {

			for ( var i = 0; i < arguments.length; i ++ ) {

				this.remove( arguments[ i ] );

			}

			return this;

		}

		var index = this.children.indexOf( object );

		if ( index !== - 1 ) {

			object.parent = null;

			object.dispatchEvent( { type: 'removed' } );

			this.children.splice( index, 1 );

		}

		return this;

	},

	getObjectById: function ( id ) {

		return this.getObjectByProperty( 'id', id );

	},

	getObjectByName: function ( name ) {

		return this.getObjectByProperty( 'name', name );

	},

	getObjectByProperty: function ( name, value ) {

		if ( this[ name ] === value ) return this;

		for ( var i = 0, l = this.children.length; i < l; i ++ ) {

			var child = this.children[ i ];
			var object = child.getObjectByProperty( name, value );

			if ( object !== undefined ) {

				return object;

			}

		}

		return undefined;

	},

	getWorldPosition: function ( optionalTarget ) {

		var result = optionalTarget || new Vector3();

		this.updateMatrixWorld( true );

		return result.setFromMatrixPosition( this.matrixWorld );

	},

	getWorldQuaternion: function () {

		var position = new Vector3();
		var scale = new Vector3();

		return function getWorldQuaternion( optionalTarget ) {

			var result = optionalTarget || new Quaternion();

			this.updateMatrixWorld( true );

			this.matrixWorld.decompose( position, result, scale );

			return result;

		};

	}(),

	getWorldRotation: function () {

		var quaternion = new Quaternion();

		return function getWorldRotation( optionalTarget ) {

			var result = optionalTarget || new Euler();

			this.getWorldQuaternion( quaternion );

			return result.setFromQuaternion( quaternion, this.rotation.order, false );

		};

	}(),

	getWorldScale: function () {

		var position = new Vector3();
		var quaternion = new Quaternion();

		return function getWorldScale( optionalTarget ) {

			var result = optionalTarget || new Vector3();

			this.updateMatrixWorld( true );

			this.matrixWorld.decompose( position, quaternion, result );

			return result;

		};

	}(),

	getWorldDirection: function () {

		var quaternion = new Quaternion();

		return function getWorldDirection( optionalTarget ) {

			var result = optionalTarget || new Vector3();

			this.getWorldQuaternion( quaternion );

			return result.set( 0, 0, 1 ).applyQuaternion( quaternion );

		};

	}(),

	raycast: function () {},

	traverse: function ( callback ) {

		callback( this );

		var children = this.children;

		for ( var i = 0, l = children.length; i < l; i ++ ) {

			children[ i ].traverse( callback );

		}

	},

	traverseVisible: function ( callback ) {

		if ( this.visible === false ) return;

		callback( this );

		var children = this.children;

		for ( var i = 0, l = children.length; i < l; i ++ ) {

			children[ i ].traverseVisible( callback );

		}

	},

	traverseAncestors: function ( callback ) {

		var parent = this.parent;

		if ( parent !== null ) {

			callback( parent );

			parent.traverseAncestors( callback );

		}

	},

	updateMatrix: function () {

		this.matrix.compose( this.position, this.quaternion, this.scale );

		this.matrixWorldNeedsUpdate = true;

	},

	updateMatrixWorld: function ( force ) {

		if ( this.matrixAutoUpdate ) this.updateMatrix();

		if ( this.matrixWorldNeedsUpdate || force ) {

			if ( this.parent === null ) {

				this.matrixWorld.copy( this.matrix );

			} else {

				this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

			}

			this.matrixWorldNeedsUpdate = false;

			force = true;

		}

		// update children

		var children = this.children;

		for ( var i = 0, l = children.length; i < l; i ++ ) {

			children[ i ].updateMatrixWorld( force );

		}

	},

	toJSON: function ( meta ) {

		// meta is a string when called from JSON.stringify
		var isRootObject = ( meta === undefined || typeof meta === 'string' );

		var output = {};

		// meta is a hash used to collect geometries, materials.
		// not providing it implies that this is the root object
		// being serialized.
		if ( isRootObject ) {

			// initialize meta obj
			meta = {
				geometries: {},
				materials: {},
				textures: {},
				images: {}
			};

			output.metadata = {
				version: 4.5,
				type: 'Object',
				generator: 'Object3D.toJSON'
			};

		}

		// standard Object3D serialization

		var object = {};

		object.uuid = this.uuid;
		object.type = this.type;

		if ( this.name !== '' ) object.name = this.name;
		if ( this.castShadow === true ) object.castShadow = true;
		if ( this.receiveShadow === true ) object.receiveShadow = true;
		if ( this.visible === false ) object.visible = false;
		if ( JSON.stringify( this.userData ) !== '{}' ) object.userData = this.userData;

		object.matrix = this.matrix.toArray();

		//

		function serialize( library, element ) {

			if ( library[ element.uuid ] === undefined ) {

				library[ element.uuid ] = element.toJSON( meta );

			}

			return element.uuid;

		}

		if ( this.geometry !== undefined ) {

			object.geometry = serialize( meta.geometries, this.geometry );

		}

		if ( this.material !== undefined ) {

			if ( Array.isArray( this.material ) ) {

				var uuids = [];

				for ( var i = 0, l = this.material.length; i < l; i ++ ) {

					uuids.push( serialize( meta.materials, this.material[ i ] ) );

				}

				object.material = uuids;

			} else {

				object.material = serialize( meta.materials, this.material );

			}

		}

		//

		if ( this.children.length > 0 ) {

			object.children = [];

			for ( var i = 0; i < this.children.length; i ++ ) {

				object.children.push( this.children[ i ].toJSON( meta ).object );

			}

		}

		if ( isRootObject ) {

			var geometries = extractFromCache( meta.geometries );
			var materials = extractFromCache( meta.materials );
			var textures = extractFromCache( meta.textures );
			var images = extractFromCache( meta.images );

			if ( geometries.length > 0 ) output.geometries = geometries;
			if ( materials.length > 0 ) output.materials = materials;
			if ( textures.length > 0 ) output.textures = textures;
			if ( images.length > 0 ) output.images = images;

		}

		output.object = object;

		return output;

		// extract data from the cache hash
		// remove metadata on each item
		// and return as array
		function extractFromCache( cache ) {

			var values = [];
			for ( var key in cache ) {

				var data = cache[ key ];
				delete data.metadata;
				values.push( data );

			}
			return values;

		}

	},

	clone: function ( recursive ) {

		return new this.constructor().copy( this, recursive );

	},

	copy: function ( source, recursive ) {

		if ( recursive === undefined ) recursive = true;

		this.name = source.name;

		this.up.copy( source.up );

		this.position.copy( source.position );
		this.quaternion.copy( source.quaternion );
		this.scale.copy( source.scale );

		this.matrix.copy( source.matrix );
		this.matrixWorld.copy( source.matrixWorld );

		this.matrixAutoUpdate = source.matrixAutoUpdate;
		this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;

		this.layers.mask = source.layers.mask;
		this.visible = source.visible;

		this.castShadow = source.castShadow;
		this.receiveShadow = source.receiveShadow;

		this.frustumCulled = source.frustumCulled;
		this.renderOrder = source.renderOrder;

		this.userData = JSON.parse( JSON.stringify( source.userData ) );

		if ( recursive === true ) {

			for ( var i = 0; i < source.children.length; i ++ ) {

				var child = source.children[ i ];
				this.add( child.clone() );

			}

		}

		return this;

	}

} );


export { Object3D };
