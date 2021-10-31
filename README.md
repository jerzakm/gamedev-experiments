## Running JS physics in a webworker - my experience building a proof of concept

Web workers are a great way of offloading compute intensive tasks from the main thread. I have been interested in using them for quite a while, but none of the projects I worked on really justified using them. Until now! In this short series I'm going to explore using webworkers, physics, pixi.js and others to create interactive web experiences and games.

- [Live](https://workerized-matterjs-pixi.netlify.app/)
- [Github](https://github.com/jerzakm/gamedev-experiments/tree/main/matterjs-pixi-worker)

![nbrpJOCJQu.gif](https://media.graphcms.com/6buI1RaOvW2KIklhMDAz)

## Webworkers tldr;

- scripts that run in background threads
- they communicate with the main thread by sending and receiving messages

In depth info, better than I could ever explain:

- [Using web workers for safe, concurrent JavaScript - Bruce Wilson, Logrocket](https://blog.logrocket.com/using-webworkers-for-safe-concurrent-javascript-3f33da4eb0b2/)
- [MDN entry](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

## Why?

The benefits of using webworkers are undeniable. Most importantly it **keeps main thread responsive.** Frozen webpages and slow UI make for terrible user experience. In my case, even if the physics simulation slows down to 20-30 fps, mainthread renderer still runs at a constant 144 fps. It helps keep animations nice and juicy and the page responsive to user inputs.

I am guilty of making very CPU intensive terrain generation in the past, it would freeze a user's browser for 2-3 seconds and it was terrible.

## Proof of concept implementation:

This is not a step by step tutorial, I wanted to keep this article more conceptual and code-light. You should be able to follow my Spaghetti code in [the project repo](https://github.com/jerzakm/gamedev-experiments/tree/main/matterjs-pixi-worker).

### 1. Vite bundler

I decided against using any framework to avoid unnecessary complexity. For my bundler I decided to use Vite since I was familiar with it [and the provided vanilla Typescript template](https://github.com/vitejs/vite/tree/main/packages/create-vite). It provides an [easy way to import webworkers](https://vitejs.dev/guide/features.html#web-workers) and their dependencies even from Typescript files.

### 2. Pixi.js renderer

[Pixi.js](https://pixijs.com/) is a fairly easy to use WebGL renderer. It will show what we're doing on screen. Everything I'm doing can be replicated by copying one of [the examples](https://pixijs.io/examples/#/demos-basic/container.js). All you need is to:

- setup the renderer
- load texture and make sprites
- update sprite position and angle in the ticker

### 3. Finally, making the worker!

- make a file with a worker, like `physicsWorker.ts`. Code gets executed on worker load.
- import and initialize the worker in the main thread - [vite docs](https://vitejs.dev/guide/features.html#web-workers)
- from now on you can setup listeners and send messages between main thread and the worker

### 4. Physics engine in the worker.

[Matter.js](https://brm.io/matter-js/) is a 2D physics engine I've decided to use. It's far from being the most performant, but it's user friendly and helps keep code complexity down.

Engine, World and a 'gameloop' get created when web worker is loaded. Gameloop is a function that continuously runs and calls `Engine.update(physics.engine, delta);`

### 5. Communication & command pattern

Like I mentioned before, worker and the thread communicate with messages. I found this to be a natural fit for a [command pattern](https://gameprogrammingpatterns.com/command.html).

Actor (either main or worker thread) sends an object that has all information required to perform an action by the subject. I decided to structure my commands like below.

```ts
const command = {
  type: "ADD_BODY",
  data: {
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    options: {
      restitution: 0,
    },
  },
};
```

To send the above command, main thread calls `worker.postMessage(command);`. For a worker to receive it, we need to set up a listener.

```ts
// Worker has to call 'self' to send and receive
self.addEventListener("message", (e) => {
  const message = e.data || e;

  // Worker receives a command to ADD_BODY
  if (message.type == "ADD_BODY") {
    // it does stuff
    const { x, y, width, height, options } = message.data;
    const body = physics.addBody(x, y, width, height, options);

    // Worker sends a command to main thread (BODY_CREATED)
    // it will be used to spawn a sprite
    self.postMessage({
      type: "BODY_CREATED",
      data: {
        id: body.id,
        x,
        y,
        width,
        height,
        angle: 0,
        sprite: undefined,
      },
    });
  }
});
```

**Here's a general overview of how this example works**
![Untitled.png](https://media.graphcms.com/gqr7vUh4SmuwgE5Rjs5c)

### 6. Features explained

#### Create body

- Main thread sends a command `ADD_BODY` with position, width, height and [physics options](https://brm.io/matter-js/docs/classes/Body.html#properties)
- When worker thread receives an `ADD_BODY` it adds the body with given parameters to the world
- After body is added, worker sends `BODY_CREATED` command back to main thread. **The most important part of this message is the id**. This is how technically unrelated javascript objects (body in worker and sprite in main) will sync. It also sends width, height, position, angle
- When main thread receives `BODY_CREATED` position it creates an object containing the data received as well as a `PIXI.Sprite` it assigns to it.

#### Synchronising object position between physics engine and renderer

- each frame physics engine sends command `BODY_SYNC`, it contains position and angle of every body in the physics world. It's stored in the hashmap format, with body id being the key.

```ts
const data: any = {};

for (const body of world.bodies) {
  data[body] = {
    x: body.position.x,
    y: body.position.y,
    angle: body.angle,
  };
}
self.postMessage({
  type: "BODY_SYNC",
  data,
});
```

- mainthread receives the body `BODY_SYNC`. It loops over every body previously added and updates it.

```ts
if (e.data.type == "BODY_SYNC") {
  const physData = e.data.data;

  bodySyncDelta = e.data.delta;

  for (const obj of physicsObjects) {
    const { x, y, angle } = physData[obj.id];
    if (!obj.sprite) return;
    obj.sprite.position.x = x;
    obj.sprite.position.y = y;
    obj.sprite.rotation = angle;
  }
}
```

## It works!

![nbrpJOCJQu.gif](https://media.graphcms.com/6buI1RaOvW2KIklhMDAz)

### What went wrong:

- Physics performance is lacking, but there are a lot of good areas for improvement.
- Sometimes objects got out of bounds and kept flying into x,y coords of 10000+, causing slowdown and eventual crash. I quickly dealt with it by freezing any object whose coordinate is more than 3000, it's not a perfect solution and something to look out for in the future.
- Simple command pattern worked fine here but it could get very complex in some use cases

## Future improvement considerations

### 1. Matter.js is slow

According to [this outdated benchmark](http://olegkikin.com/js-physics-engines-benchmark/) matter.js is one of the slowest available javascript physics engines. It's performance has improved since then, but there are other alternatives. I am especially interested in WASM libraries with js binding, like

- [box2dwasm](https://github.com/Birch-san/box2d-wasm) - an old, still maintained C++ library compiled to WASM. The documentation is lacking and developer experience seems poor.
- [rapier.rs](https://rapier.rs) - modern physics library written in Rust. It looks good and performant, at a first glance dev experience is a lot better than box2d. [Documentation](https://rapier.rs/docs/user_guides/javascript/getting_started_js) gives me hope!

In general, chosing a WASM engine over JS one should yield large performance gain.

### 2. Webworker messages

Sending large amounts of data at high frequency (gameloop) between worker and mainthread with messages can cause large performance drops.

In depth dive into the issue: ["Is postmessage slow?" - surma.dev](https://surma.dev/things/is-postmessage-slow/)

Approaches to consider:

- JSON.stringify then JSON.parse of the data (this doesn't seem to boost performance for my usecase)
- Using [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) and transfering ownership between worker and main
- Using [SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) so the origin retains ownership and both threads can access the data with [Atomics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics)

I guess it's time for my own benchmark!

### 3. Using a webworker library instead of vanilla implementation

I can imagine that communication with vanilla webworkers could get very complex. [Comlink](https://github.com/GoogleChromeLabs/comlink) is something that's been on my list for a while and I'd like to try it out.

**From the [Comlink Github page](https://github.com/GoogleChromeLabs/comlink):**

Comlink makes WebWorkers enjoyable. Comlink is a tiny library (1.1kB), that removes the mental barrier of thinking about postMessage and hides the fact that you are working with workers.

At a more abstract level it is an RPC implementation for postMessage and ES6 Proxies.

### 4. Renderer interpolation

If the use case doesn't call for more, I could keep the physics engine locked at 30 or 60 fps. The issue with this, is that the movement will look 'choppy'.
I could use interpolation and use available position and velocity data to 'predict' object movement and generate the frames up to say 144fps for smooth animations.

## The end.

This turned out much longer than I expected. More to come?
