"""
This is where the implementation of the plugin code goes.
The PetriNetCodeGenerator-class is imported from both run_plugin.py and run_debug.py
"""
import sys
import logging
from webgme_bindings import PluginBase
from itertools import combinations as cmb

# Setup a logger
logger = logging.getLogger('PetriNetCodeGenerator')
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)  # By default it logs to stderr..
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

class PetriNetCodeGenerator(PluginBase):
    def main(self):
        core = self.core
        root_node = self.root_node
        active_node = self.active_node
        META = self.META

        name = core.get_attribute(active_node, 'name')

        logger.info('ActiveNode at "{0}" has name {1}'.format(core.get_path(active_node), name))

        # the children of the PetriNet
        children = core.load_children(active_node)

        # Get all of the requested metaType
        def getAllOfMetaType(metaType):
            vals = []
            for c in children:
                if core.is_type_of(c, META[metaType]):
                    vals.append(c)
            return vals

        # get pairs of transitions for checking free choice petrinet 
        def getTransitionPairs(transitions):
            return list(cmb(range(len(transitions)), 2))

        # gets the set of arcs of the specified type for the target (place or transition)
        # first gets all arctype elements then filters by the target 
        # returns array of ins or outs (places or transitions) for the target
        # placeType: string of either P2T or T2P
        def getSetOf(arcType, target):
            # flag for transition or place
            isP = 1 # assume target is place
            if core.is_type_of(target, META['Transition']):
                isP = 0 # target is transition

            if arcType == "P2T": # ins, target is dst    
                pts =[]
                # if target is transition --> pts has inplaces
                # if target is place --> pts has out transitions
                ptArcs = getAllOfMetaType("P2T")
                logger.info("ptArcs {}, isP {}".format(ptArcs, isP))
                # filter by target
                for i in ptArcs:
                    if isP: # target is place, add transition
                        if core.get_pointer_path(i, 'src') == core.get_path(target):
                            logger.info("pp {}, tp {}".format(core.get_pointer_path(i, 'src'), core.get_path(target)))
                            for c in children:
                                if c['nodePath'] == core.get_pointer_path(i, 'dst'):
                                    pts.append(c) # transition
                    else: # target is transition, add place
                        if core.get_pointer_path(i, 'dst') == core.get_path(target):
                            for c in children:
                                if c['nodePath'] == core.get_pointer_path(i, 'src'): 
                                    pts.append(c) # place
                logger.info("pts {}".format(pts))
                return pts
            elif arcType == "T2P": # outs, target is src
                tps = []
                # if target is transition --> tps has outplaces
                # if target is place --> tps has in transitions
                tpArcs = getAllOfMetaType("T2P")
                logger.info("tpArcs {}".format(tpArcs))
                # filter by target
                for o in tpArcs:
                    if isP: # target is place, add transition
                        if core.get_pointer_path(o, 'dst') == core.get_path(target):
                            # need to add transition node not path
                            for c in children:
                                if c['nodePath'] == core.get_pointer_path(o, 'src'):
                                    tps.append(c)
                    else: # target is transition, add place
                        if core.get_pointer_path(o, 'src') == core.get_path(target):
                            # need to add place node not path
                            for c in children:
                                if c['nodePath'] == core.get_pointer_path(o, 'dst'):
                                    tps.append(c)
                logger.info("tps {}".format(tps))
                return tps

        # gets the intersection of specified type of placeset for 2 different transitions
        # placeType: string of either P2T or T2P
        def isPlaceSetIntersectionEmpty(arcType, transition1, transition2):
            places1 = getSetOf(arcType, transition1)
            places2 = getSetOf(arcType, transition2)
            for p1 in places1:
                if p1 in places2:
                    return False # non-empty intersection
            return True # empty intersection

        # the main function to classify the PetriNet
        # children of active node loaded
        def classifyPetriNet():
            if isWorkflowNet():
                self.send_notification("Petri net is a Workflow net")
            elif isMarkedGraph():
                self.send_notification("Petri net is a Marked graph")
            elif isStateMachine():
                self.send_notification("Petri net is a State machine")
            elif isFreeChoicePetriNet():
                self.send_notification("Petri net is a Free-choice petri net")
            else:
                self.send_notification("Petri net is not valid")
        # Free choice petrinet check - each transition has a unique set of inplaces
        # get all transition pairs (t1, t2), t1 != t2
        def isFreeChoicePetriNet():
            transitions = getAllOfMetaType("Transition")
            logger.info("transitions {}".format(transitions))
            pairs = getTransitionPairs(transitions)
            for p in pairs:
                isEmpty = isPlaceSetIntersectionEmpty("P2T", transitions[p[0]], transitions[p[1]])
                if not isEmpty:
                    # inplace set is not unique, p[0] != p[1] by default
                    return False 
            # each transition has a unique set of inplaces
            return True

        # State Machine check - each transition has exactly one inplace and one outplace
        def isStateMachine():
            transitions = getAllOfMetaType('Transition')
            for t in transitions:
                ip = getSetOf('P2T', t)
                op = getSetOf('T2P', t)
                if len(ip) != 1 or len(op) != 1:
                    return False
            return True 

        # Marked Graph - every place has exactly one out transition and one in transition
        def isMarkedGraph():
            places = getAllOfMetaType('Place')
            for p in places:
                intr = getSetOf('T2P', p)
                logger.info("intrans {}".format(intr))
                outr = getSetOf('P2T', p)
                logger.info("outtrans {}".format(outr))
                if len(intr) != 1 or len(outr) != 1:
                    return False
            return True

        # Helper for workflow net check
        def getSourcesAndSinks():
            places = getAllOfMetaType('Place') # works
            srcs = []
            snks = []
            logger.info("places {}".format(places))
            for p in places:
                intr = getSetOf('T2P', p)
                outr = getSetOf('P2T', p)
                logger.info("place {} intr {}, outr {}".format(p, intr, outr))
                if len(intr) == 0:
                    # source --> 0 in transitions
                    srcs.append(p)
                elif len(outr) == 0:
                    # sink --> 0 out transitions
                    snks.append(p)
            return srcs, snks

        # Workflow net - one source place s and one sink place o and every (place, transition) is on a path from s to o
            # p-t-p-t-p-t-p
        def isWorkflowNet():
            srcs, snks = getSourcesAndSinks()
            logger.info("srcs {} len {}, snks {} len {}".format(srcs, len(srcs), snks, len(snks)))
            if len(srcs) != 1 or len(snks) != 1:
                return False
            # exactly 1 source and 1 sink - ensure 1 path to get from source to sink
            src = srcs[0]
            snk = snks[0]
            return reachable(src, snk)

        # recursive helper checks whether end is reachable from start
        # given a start place the base case is checked and if not true then
        # all of the out places/transitions (depending on start) are stored and
        # checked over. If any one of these elements cannot reach the end, then 
        # the definition of a workflow net is violated so return false
        def reachable(start, end):
            # base case
            logger.info("start is {}".format(start))
            if start == end:
                return True
            # for all out places/transitions from source check if can reach snk 
            if core.is_type_of(start, META['Place']):
                # outs has transitions
                outs = getSetOf('P2T', start)
            elif core.is_type_of(start, META['Transition']):
                # outs has places
                outs = getSetOf('T2P', start)
            # nowhere to go and start != end --> deadend
            if len(outs) == 0:
                return False
            # check the rest
            logger.info("outs {}".format(outs))
            for o in outs:
                if not reachable(o, end):
                    return False
            # can reach end from all o's
            return True

        logger.info("classifying petri net...")
        classifyPetriNet()

        commit_info = self.util.save(root_node, self.commit_hash, 'master', 'Python plugin updated the model')
        logger.info('committed :{0}'.format(commit_info))
