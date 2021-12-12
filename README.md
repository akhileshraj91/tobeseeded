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
 - For all ​inplaces ​of the transition (that are connected to the transition via an incoming arc) the amount of tokens at the place is non zero
 - Firing ​an enabled transition decreases the amount of tokens on all ​inplaces w​ ith one and increases the amount of token in all ​outplaces ​of the transition by one.

 A petrinet can be classified into any of the four following classes:
- Free-choice petri net​ - if the intersection of the inplaces sets of two transitions are not
empty, then the two transitions should be the same (or in short, each transition has its
own unique set if ​inplaces)​
- State machine​ - a petri net is a state machine if every transition has exactly one ​inplace
and one ​outplace​.
- Marked graph​ - a petri net is a marked graph if every place has exactly one out transition
and one in transition.
- Workflow net ​- a petri net is a workflow net if it has exactly one source place s where *s
=∅, one sink place o where o* =∅, and every x∈P∪T is on a path from s to o


## Installation and Setup of Docker

The easiest way to start using this project is to fork it in git. Alternatively, you can create your empty repository, copy the content and just rename all instances of 'WDeStuP' to your liking. Assuming you fork, you can start-up following this few simple steps:
- install [Docker-Desktop](https://www.docker.com/products/docker-desktop)
- clone the repository
- edit the '.env' file so that the BASE_DIR variable points to the main repository directory
- `docker-compose up -d`
- connect to your server at http://localhost:8888

### Main docker commands
All of the following commands should be used from your main project directory (where this file also should be):
- To **rebuild** the complete solution `docker-compose build` (and follow with the `docker-compose up -d` to restart the server)
- To **debug** using the logs of the WebGME service `docker-compose logs webgme`
- To **stop** the server just use `docker-compose stop`
- To **enter** the WebGME container and use WebGME commands `docker-compose exec webgme bash` (you can exit by simply closing the command line with linux command 'exit') 
- To **clean** the host machine of unused (old version) images `docker system prune -f`
## Using WebGME commands to add components to your project
In general, you can use any WebGME commands after you successfully entered the WebGME container. It is important to note that only the src directory is shared between the container and the host machine, so you need to additionally synchronize some files after finishing your changes inside the container! The following is few scenarios that frequently occur:
### Adding new npm dependency
When you need to install a new library you should follow these steps:
- enter the container
- `npm i -s yourNewPackageName`
- exit the container
- copy the package.json file `docker-compose cp webgme:/usr/app/package.json package.json`
### Adding new interpreter/plugin to your DS
Follow these steps to add a new plugin:
- enter the container
- for JS plugin: `npm run webgme new plugin MyPluginName`
- for Python plugin: `npm run webgme new plugin -- --language Python MyPluginName`
- exit container
- copy webgme-setup.json `docker-compose cp webgme:/usr/app/webgme-setup.json webgme-setup.json`
- copy webgme-config `docker-compose cp webgme:/usr/app/config/config.webgme.js config/config.webgme.js`
### Adding new visualizer to your DS
Follow these steps to add a new visualizer:
- enter the container
- `npm run webgme new viz MyVisualizerName`
- exit container
- copy webgme-setup.json `docker-compose cp webgme:/usr/app/webgme-setup.json webgme-setup.json`
- copy webgme-config `docker-compose cp webgme:/usr/app/config/config.webgme.js config/config.webgme.js`
### Adding new seed to your DS
Follow these steps to add a new seed based on an existing project in your server:
- enter the container
- `npm run webgme new seed MyProjectName -- --seed-name MySeedName`
- exit container
- copy webgme-setup.json `docker-compose cp webgme:/usr/app/webgme-setup.json webgme-setup.json`
- copy webgme-config `docker-compose cp webgme:/usr/app/config/config.webgme.js config/config.webgme.js`

### Creating PetriNet Models

Once you have set-up the docker environment you can execute it by using `docker-compose up -d`. Once you see that the docker is running open your browser and browse to your local host at http://localhost:8888.
Within the localhost:
- Create a new project using the seed tobeseeded.
- You can see an example folder where you can see a few examples of petri nets.
- You can try executing these examples using the Acore visualizers chosen from the visualizer and play around.
- You can also run the python plugin using the play button on the top left corner to see what class this petri net belongs to.
- Now you can create one for yourselves by opening the componsition and dragging a new example to the folder.
- Open the Example folder and drag components from the panel located at the bottom left side of the screen. 
- Connect Each of the components using the connectors and you are good to execute your petri nets.

