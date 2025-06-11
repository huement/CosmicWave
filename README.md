# CosmicWave

Create dynamic SVG '**waves**' on each page render or animate them for never ending movement. Each wave is tied to a single HTML element whose attributes control the wave parameters.

## USAGE

the holy trinity of JS+CSS+HTML could not be simplier to setup.

**Javascript**

```javascript
import '@huement/cosmicwave'
```

**CSS**

```css
svg {
  fill: #000;
  height: 50rem;
}
```

**HTML**

```html
<!-- Easy Peasy! -->
<cosmic-wave data-start-zero=true></cosmic-wave>
```

[Documentation + Examples](https://huement.github.io/Cosmicwave)


### ADVANCED USAGE

You can 'control' the randomness to make certain things possible, such as having the wave start or end at zero. this can be helpful if you want to create a seamless experience, where you may wany just the middle to have a wave, or have the wave 'fall' to one side or the other. You can do this by using the `data-start-zero=true` and / or `data-end-zero=true`. See the documentation for more details and examples. 

## OPTIONS

Here are all the options for configuring the wave

| Command    | Type    | Details                                    |
| ---------- | ------- | ------------------------------------------ |
| `test`     | Boolean | Causes the wave to behave in a certain way |
| `test-two` | String  |                                            |
