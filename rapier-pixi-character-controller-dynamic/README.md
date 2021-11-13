Following up on my recent 'discovery' of the [Rapier.rs physics engine](https://rapier.rs) I make a first attempt at a character controller.

## Rigid-body choices for a character controller in Rapier.rs

With the exception of `Static` all other body types seem viable to make a controller, namely:

- `KinematicPositionBased`
- `KinematicVelocityBased`
- `Dynamic`

Kinematic bodies allow us to set their Position and Velocity, so at a first glance it sounds like they'd make a good controller. Unfortunately they come with a few caveats, making them harder to use than you'd think. The biggest drawback for a quick and easy character controller is the fact that they don't interact with static bodies out of the gate and will clip through them. Not great if we want our character stick to walls and platforms. Rapier provides us with a lot of options to handle this drawback. Scene queries and hooks are quite robust, allowing user to roll their own collision logic, but it's not something I want to get into before learning a bit more about the engine.

The last remaining choice, `Dynamic` is a fully fledged body that interacts with the entire world.

## Setup

To not make this article unnecessarily long, I will skip the world and renderer setup and instead link the github repo for the project. It should be easy enough to follow and you're always welcome to hit me up with any questions you might have.

Before proceeding with character controller I setup:

- rapier.rs physics world with gravity `{x: 0, y: 0}` - for the topdown experience
- add walls to browser window bounds
- spawn Dynamic objects for our character to interact with later, in this case 100 randomly sized balls
- render walls and balls with simple pixi.js graphics

## Step by step

Steps to implement a simple keyboard and point to click controller:

### Player body setup

1. Create a player physics body and place it in the middle of the screen with `setTranslation`

```ts
const body = world.createRigidBody(
  RAPIER.RigidBodyDesc.newDynamic().setTranslation(
    window.innerWidth / 2,
    window.innerHeight / 2
  )
);
```

2. Make a collider description so the body has shape and size. It needs it to interact with the world. For this example we're going with a simple circle. Translation in this step describes the collider's relative position to the body.

```ts
const colliderDesc = new RAPIER.ColliderDesc(
  new RAPIER.Ball(12)
).setTranslation(0, 0);
```

3. Create a collider, attach it to the body and add the whole thing to the world.

```ts
const collider = world.createCollider(colliderDesc, body.handle);
```

### Keyboard WASD control bindings

In later steps we will move the player's body based on the provided direction. To get that we're going to setup a basic WASD control scheme with listeners listening to `keydown` and `keyup`. They will manipulate a direction vector:

```ts
const direction = {
  x: 0,
  y: 0,
};
```

When the key is pressed down, player begins to move:

```ts
window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "w": {
      direction.y = -1;
      break;
    }
    case "s": {
      direction.y = 1;
      break;
    }
    case "a": {
      direction.x = -1;
      break;
    }
    case "d": {
      direction.x = 1;
      break;
    }
  }
});
```

Then, when the key is released the movement on that particular axis (x or y) is set to 0.

```ts
window.addEventListener("keyup", (e) => {
  switch (e.key) {
    case "w": {
      direction.y = 0;
      break;
    }
    case "s": {
      direction.y = 0;
      break;
    }
    case "a": {
      direction.x = 0;
      break;
    }
    case "d": {
      direction.x = 0;
      break;
    }
  }
});
```

### Moving the body

Now that we've made a way for us to imput where the player has to go, it's time to make it happen. We will create an `updatePlayer` function that will have to be called every frame.

The most basic approach is as simple as the snippet below, we simply set the body's velocity to the `direction`.

```ts
const updatePlayer = () => {
  body.setLinvel(direction, true);
};
```

You might notice though, that the body isn't moving much. That's because we only set the direction vector to go from -1 to 1, and that isn't very fast. To combat that and make the code more reusable we add a `MOVE_SPEED` variable and multiply the x and y of the direction.

```ts
const MOVE_SPEED = 80;

const updatePlayer = () => {
  body.setLinvel(
    { x: direction.x * MOVE_SPEED, y: direction.y * MOVE_SPEED },
    true
  );
};
```

That's more like it!

**Bonus method: Applying force to move the body**
When I was playing around and writing this article I found another cool way to make our player's body move. Instead of setting the velocity directly, we "push" the body to make it go in the desired direction at a desired speed. It gives a smoother, more natural feeling movement right out of the gate.

The whole thing is just these few lines of code but it's a little more complicated than the previous example.

The concept is simple. We apply impulse in order to make the body move, but what if it starts going too fast or we want to stop?

We check the body's current velocity with `const velocity = body.linvel();`.Then, to determine what impulse should be applied next, we take the difference of the desired and current velocity for both axis `direction.x * MOVE_SPEED - velocity.x `. If the body is moving too fast or in the wrong direction, an impulse counteracting that is applied. We multiply it by `ACCELERATION` constant to.. drumroll - make the body accelerate faster or slower.

![Moving with impulse.png](https://media.graphcms.com/3CtKK59cSQWohAcACggc)

```ts
const MOVE_SPEED = 80;
const ACCELERATION = 40;

const velocity = body.linvel();

const impulse = {
  x: (direction.x * MOVE_SPEED - velocity.x) * ACCELERATION,
  y: (direction.y * MOVE_SPEED - velocity.y) * ACCELERATION,
};
body.applyImpulse(impulse, true);
```

You can achieve similar effect by using the velocity method and applying some form of [easing](https://developers.google.com/web/fundamentals/design-and-ux/animations/the-basics-of-easing).

Note: For simplicity, I use `VELOCITY` and `ACCELERATION` in relation to one value of the vector. So velocity with value of `2` would look like this: `{x: 2, y: 2}`, where in reality velocity is almost always the length of such vector - `const velocity = Math.sqrt(2**2 + 2**2)` resulting in velocity of ~2.83!. This means that if we used my implementation in a game, moving diagonally would be 40% faster than going up and down!
**TLDR; Use correct velocity, calculated for example with Pythagorem's theorem.**

If you made it this far, thank you so much for reading. Let me know if you have any questions or maybe would like to see other things implemented.
