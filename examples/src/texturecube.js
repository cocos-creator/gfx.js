(() => {
  let gfx = window.gfx;
  let device = window.device;
  let canvas = window.canvas;
  let resl = window.resl;
  var texture = null;
  let { vec3, mat4 } = window.vmath;
  // init resources
  let program = new gfx.Program(device, {
    vert: `
      precision mediump float;
      uniform mat4 model, view, projection;
      attribute vec3 a_position;
      varying vec3 v_texcoord;
      void main () {
        gl_Position = projection * view * model * vec4(a_position, 1);
        v_texcoord = a_position;
      }
    `,
    frag: `
      precision mediump float;
      uniform samplerCube texture;
      uniform vec4 color;
      varying vec3 v_texcoord;
      void main () {
        gl_FragColor = textureCube(texture, v_texcoord);
      }
    `,
  });
  program.link();

  let program2 = new gfx.Program(device, {
    vert: `
      precision mediump float;
      uniform mat4 model, view, projection;
      attribute vec3 a_position;
      attribute vec3 a_color;
      varying vec3 v_color;
      void main () {
        gl_Position = projection * view * model * vec4(a_position, 1.0);
        v_color = a_color;
      }
    `,
    frag: `
      precision mediump float;
      varying vec3 v_color;
      void main () {
        gl_FragColor = vec4(v_color, 1.0);
      }
    `,
  });
  program2.link();

  resl({
    manifest: {
      image0: {
        type: 'image',
        src: './assets/skybox_posx.png'
      },
      image1: {
        type: 'image',
        src: './assets/skybox_negx.png'
      },
      image2: {
        type: 'image',
        src: './assets/skybox_posy.png'
      },
      image3: {
        type: 'image',
        src: './assets/skybox_negy.png'
      },
      image4: {
        type: 'image',
        src: './assets/skybox_posz.png'
      },
      image5: {
        type: 'image',
        src: './assets/skybox_negz.png'
      },
    },
    onDone (assets) {
      var image = assets.image0;
      texture = new gfx.TextureCube(device, {
        width : image.width, 
        height : image.height,
        images : [[assets.image0,assets.image1,assets.image2,assets.image3,assets.image4,assets.image5]]
      });
    }
  });
  let vertexFmt = new gfx.VertexFormat([
    { name: gfx.ATTR_POSITION, type: gfx.ATTR_TYPE_FLOAT32, num: 3 },
    { name: gfx.ATTR_COLOR, type: gfx.ATTR_TYPE_FLOAT32, num: 3 }
  ]);
  var verts = [
    -1, -1, -1, 0, 0, 0,
    1, -1, -1, 1, 0, 0,
    1, 1, -1, 1, 1, 0,
    -1, 1, -1, 0, 1, 0,
    -1, -1, 1, 0, 0, 1,
    1, -1, 1, 1, 0, 1,
    1, 1, 1, 1, 1, 1,
    -1, 1, 1, 0, 1, 1
  ];
  var indices = [
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    0, 4, 7, 0, 7, 3,
    1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3,
    0, 1, 5, 0, 5, 4
  ];
  let vertexBuffer = new gfx.VertexBuffer(
    device,
    vertexFmt,
    gfx.USAGE_STATIC,
    new Float32Array(verts),
    8,
    false
  );
  let indexBuffer = new gfx.IndexBuffer(
    device,
    gfx.INDEX_FMT_UINT16,
    gfx.USAGE_STATIC,
    new Uint16Array(indices),
    indices.length,
    false
  );
  
  let model = mat4.create();
  let view = mat4.create();
  let projection = mat4.create();
  let eye = vec3.create();
  let center = vec3.create();
  let up = vec3.create();
  // tick
  return function tick() {
    mat4.lookAt(view,
      vec3.set(eye, 0, 0, 0),
      vec3.set(center, 0, 0, 5),
      vec3.set(up, 0, 1, 0)
    );

    mat4.perspective(projection,
      Math.PI / 4,
      canvas.width / canvas.height,
      0.01,
      1000
    );
    let scaling = vec3.create();
    vec3.set(scaling, 50, 50, 50);
    mat4.fromScaling(model, scaling);
    device.setViewport(0, 0, canvas.width, canvas.height);
    device.clear({
      color: [0.1, 0.1, 0.1, 1],
      depth: 1
    });
    device.enableDepthTest();
    device.enableDepthWrite();
    device.setCullMode(gfx.CULL_NONE);
    device.setUniform('model', mat4.array(new Float32Array(16), model));
    device.setUniform('view', mat4.array(new Float32Array(16), view));
    device.setUniform('projection', mat4.array(new Float32Array(16), projection));
    device.setVertexBuffer(0, vertexBuffer);
    device.setIndexBuffer(indexBuffer);
    if (texture) {
      device.setTexture('texture', texture, 0);
    }
    device.setProgram(texture ? program : program2);
    device.draw(0, indices.length);
  };
})();
