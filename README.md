# Petri Nets

## Introduction

Petri Nets develiped by Carl Adam Petri, is a special segment of bipratite digraphs that can be used to model a wide variety of graphical applications. These applications include Office automation, work-flows, social networks, distributed systems, communication protocols, flexible manufacturing, programming languages and many more.

## Domain Information
The Key elements of a Petri Net are:
- Places
- Arcs
- Transitions
- Tokens

The general convention for representing these elements are circles, squares, lines and dots, respectively. Arcs connects a transition to a place or a place to transition, which gives them their classification names as outgoing and incoming arcs respectively. Accordingly, the places that are connected to a transition are called inplaces and outplaces of the transitions. The parameter that are communicated between these arcs are tokens which travel between the places, through transitions changing the token number associated with each of the places and changing the state of transitions. As hinted each transition can take two states representing enabled or disabled states depending on the token number of its inplaces. 

The following definitions cover how the petri net progress from one marking to another:
 - ![equation](t \in T \text{is enabled if} ) - for all ​inplaces ​of the transition (that are connected to the transition via an incoming arc) the amount of tokens at the place is non zero
 - Firing ​an enabled transition decreases the amount of tokens on all ​inplaces w​ ith one and increases the amount of token in all ​outplaces ​of the transition by one.