# Gentzen

Gentzen is an automated propositional logic proof system, using Gerhard Gentzen's algorithm.

Simply-put, Gentzen attempts to find counter-examples that will disprove a given proposition. Basic manipulations are performed on the proposition to produce *finished* expressions that cannot be simplified any further. If all such simplifications are *axiomatic* (unfalsifiable), then the original proposition is a tautology. Otherwise, all non-axiomatic simplifications can be used to derive all counter-examples that disprove the original proposition.

Gentzen is written as a simple web application for maximum portability. A demonstration can be found [here](https://www.jager-kujawa.com/Gentzen).

The code is implemented in [TypeScript](https://typescriptlang.org), and the front end is developed using [Semantic UI](https://www.semantic-ui.com). The final deduction tree is displayed using [Treant.js](https://github.com/fperucic/treant-js).
