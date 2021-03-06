/*globals define, WebGMEGlobal*/

/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Wed Apr 14 2021 10:39:10 GMT-0500 (Central Daylight Time).
 */

define(['jointjs', 'css!./styles/AcoreWidget.css'], function (joint) {
    'use strict';

    var WIDGET_CLASS = 'sim-s-m';

    function AcoreWidget(logger, container) {
        this._logger = logger.fork('Widget');

        this._el = container;

        this.nodes = {};
        this._initialize();

        this._logger.debug('ctor finished');
    }

    AcoreWidget.prototype._initialize = function () {
        // console.log(joint);
        var width = this._el.width(),
            height = this._el.height(),
            self = this;

        // set widget class
        this._el.addClass(WIDGET_CLASS);

        this._jointSM = new joint.dia.Graph;
        this._jointPaper = new joint.dia.Paper({
            el: this._el,
            width : width,
            height: height,
            model: this._jointSM,
            interactive: false
        });

        // add event calls to elements
        this._jointPaper.on('element:pointerdblclick', function(elementView) {
            const currentElement = elementView.model;
            // console.log(currentElement);
            if (self._webgmeSM) {
                console.log(self._webgmeSM.id2state[currentElement.id]);
                self._setCurrentState(self._webgmeSM.id2state[currentElement.id]);
            }
        });

        this._webgmeSM = null;
    };

    AcoreWidget.prototype.onWidgetContainerResize = function (width, height) {
        this._logger.debug('Widget is resizing...');
    };

    // State Machine manipulating functions called from the controller
    AcoreWidget.prototype.initMachine = function (machineDescriptor) {
        const self = this;
        // console.log(machineDescriptor);
        var token = joint.dia.Element.define('token', {
            attrs: {
                text: {
                    fontWeight: 'bold',
                    fontSize: 20,
                    refX: 22,
                    refY: 22
                }
            }
        },{
            markup: [{tagName: 'text', selector: 'text'}]
        });

        self._webgmeSM = machineDescriptor;
        // console.log(self._webgmeSM)
        // self._webgmeSM.current = self._webgmeSM.inplaces;
        // console.log(self._webgmeSM.current)
        self._jointSM.clear();
        const sm = self._webgmeSM;
        sm.id2state = {}; // this dictionary will connect the on-screen id to the state id
        // first add the states
        // console.log("Element keys are",Object.keys(sm.states));
        Object.keys(sm.states).forEach(stateID => {
            // console.log("IDs are: ",stateId);
            // console.log("states are: ",sm.states);
            // console.log("Transitions are:",sm.Transitions);
            // console.log("Arcs are",sm.Arcs);
            // console.log("Init is:",sm.init)
            // console.log("Inplaces are:",sm.inplaces)
            let vertex = null;

            // if (sm.init === stateId) {
            // if (sm.inplaces.includes(stateId))
               
            vertex = new joint.shapes.standard.Circle({
                position: sm.states[stateID].position,
                size: { width: 60, height: 60 },
                attrs: {
                    label : {
                        // text:sm.states[stateID].name,
                        // fontWeight: 'bold',
                    },
                    body: {
                        fill: 'none',
                        cursor: 'pointer'
                    }
                }
            });
            let con = null;

            con = new token({
                position:sm.states[stateID].position,
                attrs: {
                    text:{
                        text: String(sm.states[stateID].token)
                    }
                }
            })
            vertex.addTo(self._jointSM);

            con.addTo(self._jointSM);
            sm.states[stateID].joint = vertex;
            sm.states[stateID].joint_tk = con;
            sm.id2state[vertex.id] = stateID;
        });   

        // then create the links
        // console.log(sm.Transitions)
        // console.log("__________________________________________________",sm.states)

        sm.TRAN = JSON.parse(JSON.stringify(sm.Transitions))
        Object.keys(sm.Transitions).forEach(tranID => {
            let vertex = null;
            vertex = new joint.shapes.standard.Rectangle({
                position: sm.Transitions[tranID].position,
                size: { width: 30, height: 60 },
                attrs: {
                    label : {
                        text: sm.Transitions[tranID].name,
                        //event: 'element:label:pointerdown',
                        fontWeight: 'bold',
                        'ref-y': 40
                        //cursor: 'text',
                        //style: {
                        //    userSelect: 'text'
                        //}
                    },
                    body: {
                        strokeWidth: 3,
                        fill: 'none'
                    }
                }
            });

            sm.Transitions[tranID].joint = vertex;
            vertex.addTo(self._jointSM);
            // pn.places[placeId].joint = vertex;
            // pn.id2state[vertex.id] = placeId;
        });
        // console.log("__________________________________________________",sm.Transitions)

            // console.log("Transitions are",sm.Transitions)
            // const trans = sm.Transitions[tranID];
            // console.log("Each transition",state)
        Object.keys(sm.states).forEach(SID => {
            const state = sm.states[SID];
            Object.keys(state.next).forEach(event =>{
                state.jointNext = state.jointNext || {};
                // console.log(event)
                // console.log(state.next[event])
                // console.log(sm.Transitions[state.next[event]])
                const link = new joint.shapes.standard.Link({
                    source: {id: state.joint.id},
                    target: {id: sm.Transitions[state.next[event]].joint.id},
                    attrs: {
                        line: {
                            strokeWidth: 2
                        },
                        wrapper: {
                            cursor: 'default'
                        }
                    },
                    labels: [{
                        position: {
                            distance: 0.5,
                            offset: 0,
                            args: {
                                keepGradient: true,
                                ensureLegibility: true
                            }
                        },
                    }]
                });
                link.addTo(self._jointSM);
                state.jointNext[event] = link;
                // console.log("...............",link,event,state)
            })
        });

        // console.log("__________________________________________________",sm.states)


        Object.keys(sm.Transitions).forEach(TID => {
            const trans = sm.Transitions[TID];
            Object.keys(trans.next).forEach(SID => {
                trans.jointNext = trans.jointNext || {};
                const link = new joint.shapes.standard.Link({
                    source: {id: trans.joint.id},
                    target: {id: sm.states[trans.next[SID]].joint.id},
                    attrs: {
                        line: {
                            strokeWidth: 2
                        },
                        wrapper: {
                            cursor: 'default'
                        }
                    },
                    labels: [{
                        position: {
                            distance: 0.5,
                            offset: 0,
                            args: {
                                keepGradient: true,
                                ensureLegibility: true
                            }
                        },
                        
                    }]
                });
                link.addTo(self._jointSM);
                trans.jointNext[SID] = link;
                // console.log(trans)
            })
        });
        // console.log("__________________________________________________",sm.Transitions)



    

        //now refresh the visualization
        self._jointPaper.updateViews();
        // console.log("This line is executed")
        // console.log(sm.states);

        self._decorateMachine();
        // console.log("This line is executed")
    };

    AcoreWidget.prototype.destroyMachine = function () {

    };

    AcoreWidget.prototype.fireEvent = function (event) {
        // console.log("____________1");
        const self = this;
        const sm = this._webgmeSM;
        // console.log(sm);
        Object.keys(sm.Transitions[event].inplaces).forEach(ID =>{
            // console.log(ID);
            sm.states[ID].token -= 1;
            sm.states[ID].joint_tk.attr('text/text', String(sm.states[ID].token));
            const link = sm.states[ID].jointNext[event];
            const linkView = link.findView(self._jointPaper);
            // console.log(link, linkView)
            linkView.sendToken(joint.V('circle',{r: 5, fill: 'black'}), {duration: 300}, function() {});
        });
        setTimeout(function(){
            Object.keys(sm.Transitions[event].next).forEach(out_id =>{
                sm.states[out_id].token += 1;
                sm.states[out_id].joint_tk.attr('text/text', String(sm.states[out_id].token));
                const link = sm.Transitions[event].jointNext[out_id];
                const linkView = link.findView(self._jointPaper);
                linkView.sendToken(joint.V('circle', { r: 5, fill: 'black' }), {duration:300}, function() {});
            });
            self._decorateMachine();
        }, 300)            // if (cur.jointNext === undefined){
            // } else {
                    // console.log("else is being executed");
                    // const link = cur.jointNext[event];
                    // const linkView = link.findView(self._jointPaper);
                    // linkView.sendToken(joint.V('circle', { r: 10, fill: 'black' }), {duration:500}, function() {
                    //     // console.log(current.next[event]);
                    // console.log(cur.next[event]);
                    // aux_current[cur.next[event]] = cur.next[event];
                    //     // self._webgmeSM.current = current.next[event];
                    // console.log(aux_current);
                    //     // self._decorateMachine();
                    // });
                    // console.log("what is this");
            // }
            // console.log("else got executed");
        // });
        // console.log("_______________________2");
        // console.log(self._webgmeSM.current)
        // self._webgmeSM.current = [];
        // self.aux_current.forEach(an => {self._webgmeSM.current.push(an)})
        // console.log(self.aux_current);
        // this._webgmeSM.current = aux_current;
        // console.log(this._webgmeSM.current);
        // self._decorateMachine();
        // console.log("________________________________________fireEvent Executed")

    };

    AcoreWidget.prototype.resetMachine = function () {
        // console.log(this._webgmeSM);
        this._webgmeSM.states = JSON.parse(JSON.stringify(this._webgmeSM.init.ps));
        this._webgmeSM.Transitions = JSON.parse(JSON.stringify(this._webgmeSM.init.ts));
        // console.log(this._webgmeSM.states, this._webgmeSM.Transitions);
        this.initMachine(this._webgmeSM);
    };

    AcoreWidget.prototype._decorateMachine = function() {
        const sm = this._webgmeSM;
        var enabledTransObj = {};
        // console.log(this._webgmeSM,sm);
        // console.log(sm.current,sm);
        // console.log(enabledTransObj);
        // console.log(sm.states);
        // console.log(sm.Transitions);
        Object.keys(sm.Transitions).forEach(TID => {
            // console.log("check whether this is printing")
            var enabled = true;
            Object.keys(sm.Transitions[TID].inplaces).forEach(pid => {
                if (sm.states[pid].token <= 0){
                    enabled = false;
                }
            });
            if (Object.keys(sm.Transitions[TID].inplaces).length === 0){
                enabled = false
            }
            if (enabled){
                sm.Transitions[TID].joint.attr('body/stroke', 'blue');
                enabledTransObj[TID] = sm.Transitions[TID].name;
            }
            else{
                sm.Transitions[TID].joint.attr('body/stroke', '#333333');
            }
            sm.Transitions[TID].EN = enabled
        });
        // console.log(enabledTransObj)
        sm.setFireableEvents(enabledTransObj);
    };

    //     console.log(sm.current)
    //     console.log(Object.keys(sm.current).length===0)
    //     Object.keys(sm.current).forEach(curinpnode => {
    //     console.log(curinpnode);
    //     console.log(sm.states[curinpnode].joint.attr('body/stroke'));
    //     sm.states[curinpnode].joint.attr('body/stroke', 'blue');
    //     sm.setFireableEvents(Object.keys(sm.states[curinpnode].next));
    //     });
    // };

    // AcoreWidget.prototype._setCurrentState = function(newCurrent) {
    //     this._webgmeSM.current = newCurrent;
    //     this._decorateMachine();
    // };
    

    /* * * * * * * * Visualizer event handlers * * * * * * * */

    /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
    AcoreWidget.prototype.destroy = function () {
    };

    AcoreWidget.prototype.onActivate = function () {
        this._logger.debug('AcoreWidget has been activated');
    };

    AcoreWidget.prototype.onDeactivate = function () {
        this._logger.debug('AcoreWidget has been deactivated');
    };

    return AcoreWidget;
});
