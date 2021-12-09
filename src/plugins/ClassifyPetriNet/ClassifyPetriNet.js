/*
 * Copyright (C) 2020 Vanderbilt University, All rights reserved.
 *
 * Authors:
 * Umesh Timalsina
 */
/*globals define*/
/*eslint-env node, browser*/

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase
) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);
    const PETRI_NET_CLASSES = {
        FREE_CHOICE_PETRINET: 'Free Choice PetriNet',
        STATE_MACHINE: 'State Machine',
        MARKED_GRAPH: 'Marked Graph',
        WORKFLOW_NET: 'Workflow Net',
        POSITIVE_MSG: 'This PetriNet is a',
        NEGATIVE_MSG: 'This PetriNet is not a'
    };
    const getPetriNetMessages = function (classifications) {
        let msgs = [];
        if (classifications.isFreeChoicePetriNet) {
            msgs.push(PETRI_NET_CLASSES.POSITIVE_MSG + ' ' + PETRI_NET_CLASSES.FREE_CHOICE_PETRINET);
        } else {
            msgs.push(PETRI_NET_CLASSES.NEGATIVE_MSG + ' ' + PETRI_NET_CLASSES.FREE_CHOICE_PETRINET);
        }

        if (classifications.isStateMachine) {
            msgs.push(PETRI_NET_CLASSES.POSITIVE_MSG + ' ' + PETRI_NET_CLASSES.STATE_MACHINE);
        } else {
            msgs.push(PETRI_NET_CLASSES.NEGATIVE_MSG + ' ' + PETRI_NET_CLASSES.STATE_MACHINE);
        }

        if (classifications.isMarkedGraph) {
            msgs.push(PETRI_NET_CLASSES.POSITIVE_MSG + ' ' + PETRI_NET_CLASSES.MARKED_GRAPH);
        } else {
            msgs.push(PETRI_NET_CLASSES.NEGATIVE_MSG + ' ' + PETRI_NET_CLASSES.MARKED_GRAPH);
        }

        if (classifications.isWorkFlowNet) {
            msgs.push(PETRI_NET_CLASSES.POSITIVE_MSG + ' ' + PETRI_NET_CLASSES.WORKFLOW_NET);
        } else {
            msgs.push(PETRI_NET_CLASSES.NEGATIVE_MSG + ' ' + PETRI_NET_CLASSES.WORKFLOW_NET);
        }

        return msgs;
    };

    const NAMESPACE = 'petrinets';

    class ClassifyPetriNet extends PluginBase {
        constructor() {
            super();
            this.pluginMetadata = pluginMetadata;
        }

        async main(callback) {
            const activeNode = this.activeNode;

            try {
                if (this.namespace !== NAMESPACE) {
                    throw new Error('Please run the plugin using petrinets namespace');
                }

                if (this.core.getMetaType(activeNode) !== this.META.PetriNet) {
                    throw new Error('Active node is not of type PetriNet');
                }

                if((await this.core.loadChildren(activeNode)).length === 0){
                    throw new Error('No child nodes are available');
                }
                const classifications = await this.classifyPetriNet(activeNode);
                const messages = getPetriNetMessages(classifications);
                messages.forEach(msg => {
                    this.createMessage(
                        activeNode,
                        msg,
                        'info'
                    );
                });

                this.result.setSuccess(true);
            } catch (e) {
                this.logger.error(e.message);
                this.result.setSuccess(false);
                this.createMessage(
                    activeNode,
                    e.message,
                    'error'
                );
            }
            callback(null, this.result);
        }

        async classifyPetriNet(petriNet) {
            const {places, transitions, paths} = await this._getPetriNetMap(petriNet);
            const isStateMachine = this._isStateMachine(transitions);
            const isMarkedGraph = this._isMarkedGraph(places);
            const isFreeChoicePetriNet = this._isFreeChoicePetriNet(transitions);
            const isWorkFlowNet = this._isWorkFlowNet(places, transitions, paths);
            return {
                isStateMachine,
                isMarkedGraph,
                isFreeChoicePetriNet,
                isWorkFlowNet
            };
        }

        async _getPetriNetMap(petriNet) {
            const children = await this.core.loadChildren(petriNet);
            const places = {};
            const transitions = {};
            const paths = {};
            children.forEach(child => {
                const name = this.core.getAttribute(child, 'name');
                const path = this.core.getPath(child);
                if (this.core.getMetaType(child) === this.META.Place) {
                    places[path] = {
                        name: name,
                        inTransitions: new Set(),
                        outTransitions: new Set()
                    };
                    paths[path] = [];
                } else if (this.core.getMetaType(child) === this.META.Transition) {
                    transitions[path] = {
                        name: name,
                        inPlaces: new Set(),
                        outPlaces: new Set()
                    };
                    paths[path] = [];
                }
            });

            children.forEach(child => {
                if (this.core.getMetaType(child) === this.META.P2T) {
                    const inPlacePath = this.core.getPointerPath(child, 'src');
                    const dstTransitionPath = this.core.getPointerPath(child, 'dst');
                    places[inPlacePath].outTransitions.add(dstTransitionPath);
                    transitions[dstTransitionPath].inPlaces.add(inPlacePath);
                    paths[inPlacePath].push(dstTransitionPath);
                } else if (this.core.getMetaType(child) === this.META.T2P) {
                    const outPlacePath = this.core.getPointerPath(child, 'dst');
                    const srcTransitionPath = this.core.getPointerPath(child, 'src');
                    places[outPlacePath].inTransitions.add(srcTransitionPath);
                    transitions[srcTransitionPath].outPlaces.add(outPlacePath);
                    paths[srcTransitionPath].push(outPlacePath);
                }
            });

            return {places, transitions, paths};
        }

        _isFreeChoicePetriNet(transitions) {
            const allInPlaces = new Set();
            let size = 0;
            Object.values(transitions).forEach(transition => {
                transition.inPlaces.forEach(inPlace => allInPlaces.add(inPlace));
                size += transition.inPlaces.size;
            });
            return size === allInPlaces.size;
        }

        _isStateMachine(transitions) {
            return Object.values(transitions)
                .every(transition => {
                    return (transition.inPlaces.size === 1 &&
                        transition.outPlaces.size === 1);
                });
        }

        _isMarkedGraph(places) {
            return Object.values(places).every(place => {
                return (place.inTransitions.size === 1 &&
                    place.outTransitions.size === 1);
            });
        }

        _isWorkFlowNet(places, transitions, paths) {
            const allNodes = Object.keys(places).concat(Object.keys(transitions));
            const sourcePlaces = Object.keys(places).filter(placeId => {
                return places[placeId].inTransitions.size === 0;
            });
            const sinkPlaces = Object.keys(places).filter(placeId => {
                return places[placeId].outTransitions.size === 0;
            });

            let isWorkFlowNet = false;

            if (sourcePlaces.length === 1 && sinkPlaces.length === 1) {
                const src = sourcePlaces.pop();
                const dst = sinkPlaces.pop();
                let allPaths = this._getPaths(src, dst, paths)
                    .reduce((flattened, element) => flattened.concat(element), []);
                isWorkFlowNet = allNodes.every(node => allPaths.includes(node));
            }
            return isWorkFlowNet;
        }

        _getPaths(src, dst, paths) {
            return ClassifyPetriNet._getAllPaths(paths, src, dst, []);
        }

        static _getAllPaths(graph, start, end, path = []) {
            path = path.concat([start]);
            if (start === end) {
                return [path];
            }
            if (!graph[start]) {
                return [];
            }
            const paths = [];
            graph[start].forEach(node => {
                if (!path.includes(node)) {
                    const newPaths = ClassifyPetriNet._getAllPaths(graph, node, end, path);
                    newPaths.forEach(newPath => {
                        paths.push(newPath);
                    });
                }
            });
            return paths;
        }

    }

    return ClassifyPetriNet;
});
