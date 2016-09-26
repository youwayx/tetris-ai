### Tetris AI

Demo of my current best AI so far: http://yuweixu.com/tetris-ai/

This is my attempt write a Tetris AI. In highschool, I worked on a Tetris Battle clone for a final project. However, I never had a chance to write an AI. Instead of building on top of my old code, I am using a simple Tetris I found on github. The code is very hacky because it's a lot of experimentation.

### Brief Summary of AI

Currently, the AI considers every possible position that the next piece can be placed and calculates a score. This score depends on four features: the total height of each column, sum of the height differences between neighbouring columns, number of lines cleared, and number of holes.

Initially, the AI generates 1000 sets of random weights. Each set of weights is used to simulate a tetris game. The sets that clear the most lines are used for producing the next generation of random weights. This is repeated for many generations, eventually producing sets that can clear many lines. I'll add more detail once I'm satisfied with the algorithm.

Checkout the `neural-network` branch for the AI trained using neuralevolution

More info on Genetic Algorithms:
https://en.wikipedia.org/wiki/Genetic_algorithm

Original repo and credits for creating the game: 
https://github.com/dionyziz/canvas-tetris
