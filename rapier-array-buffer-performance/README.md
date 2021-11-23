In my previous game dev attempts with javascript I always struggled with physics engine performance. I always defaulted to matter.js - it's good documentation and plentiful examples outweighed the performance gains of other available libraries. I was very excited when I first learned about WASM and near-native performance it provides, but for the longest time Box2D was the only viable choice in that area and I truely hated using it. It had poor documentation and felt very archaic to use.

Now, it seems like my woes might be over. In comes a new contender - Rapier.rs.

![Rapier.rs logo](https://media.graphcms.com/IxHiH6ZYRLuYapuZHFTT)
[Rapier home](https://rapier.rs/)

Rapier.rs is a rust physics library compiled to WASM with javscript bindings and good documentation. I was able to set it up in around 30 minutes and it provided an massive, instant boost to app performance.

Rapier remained more stable and allowed me to add thousands of more active physics bodies to the world.

**Links:**

- Example from my last article with Rapier.rs instead of matter +300% performance [LIVE](https://workerized-rapier-pixi.netlify.app/)
- [Github repo](https://github.com/jerzakm/gamedev-experiments/tree/main/rapier-pixi-worker)

| Active bodies | Matter FPS  | Rapier FPS |
| ------------- | ----------- | ---------- |
| 4500          | 38          | 120        |
| 6000          | 21          | 79         |
| 7500          | 4           | 60         |
| 9000          | 0 - crashed | 42         |
| 10000         | 0 - crashed | 31         |
| 12000         | 0 - crashed | 22         |
| 15000         | 0 - crashed | 16         |

## Why you need to consider Rapier for your js physics needs

### 1. Performance

Javascript can't compare to an optimized Rust library compiled to WASM
[WASM is just this fast](https://medium.com/@torch2424/webassembly-is-fast-a-real-world-benchmark-of-webassembly-vs-es6-d85a23f8e193)

### 2. Documentation

Rapier page provides a good overview of the key features, information how to get started and an in-depth API documentation. All of this for Rust, Rust+bevy and Javascript.

### 3. Modern developer experience

I found Rapier API very intuitive to work with, imho making it by far the best choice out of the few performant. It comes with **typescript support**. Resulting code is readable and easy to reason with.

```js
import("@dimforge/rapier2d").then((RAPIER) => {
  // Use the RAPIER module here.
  let gravity = { x: 0.0, y: 9.81 };
  let world = new RAPIER.World(gravity);

  // Create the ground
  let groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.1);
  world.createCollider(groundColliderDesc);

  // Create a dynamic rigid-body.
  let rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic().setTranslation(
    0.0,
    1.0
  );
  let rigidBody = world.createRigidBody(rigidBodyDesc);

  // Create a cuboid collider attached to the dynamic rigidBody.
  let colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5);
  let collider = world.createCollider(colliderDesc, rigidBody.handle);

  // Game loop. Replace by your own game loop system.
  let gameLoop = () => {
    // Step the simulation forward.
    world.step();

    // Get and print the rigid-body's position.
    let position = rigidBody.translation();
    console.log("Rigid-body position: ", position.x, position.y);

    setTimeout(gameLoop, 16);
  };

  gameLoop();
});
```

### 4. Cross-platform determinism & snapshotting

- Running the **same simulation**, with the same initial conditions on different machines or distributions of Rapier (rust/bevy/js) **will yield the same result.**

- **Easy data saving and restoring.** - _It is possible to take a snapshot of the whole physics world with `world.takeSnapshot`. This results in a byte array of type Uint8Array that may be saved on the disk, sent through the network, etc. The snapshot can then be restored with `let world = World.restoreSnapshot(snapshot);`_.

## What's next?

I am excited to keep working with Rapier, but in the meanwhile I think a proper physics benchmark is in order. The ones I've found while doing research were a bit dated.

### Other: Vite usage errors

I've ran into some issues adding Rapier to my Vite project, the solution can be found here: https://github.com/dimforge/rapier.js/issues/49
