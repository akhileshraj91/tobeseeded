"""
This is where the implementation of the plugin code goes.
The AcorePlugin-class is imported from both run_plugin.py and run_debug.py
"""
import sys
import logging
from webgme_bindings import PluginBase
from itertools import combinations as cmb

# Setup a logger
logger = logging.getLogger('AcorePlugin')
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)  # By default it logs to stderr..
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

class AcorePlugin(PluginBase):
    def main(self):
        active_node = self.active_node
        core = self.core
        logger = self.logger
        META = self.META
        
        TG = {}
        CG = {}
        PG = {}
        TRAN = {}
        PLACES = {}
        arcs = {}
        
        
        nodes = core.load_sub_tree(active_node)
        for node in nodes:
            if core.is_instance_of(node, META['Transitions']):
                TRAN[core.get_path(node)] = node
                CG[core.get_path(node)] = []
                TG[core.get_path(node)] = {'inp':[], 'outp':[]}
            elif core.is_instance_of(node, META['Arcs']):
                arcs[core.get_path(node)] = node
            elif core.is_instance_of(node, META['Places']):
                PLACES[core.get_path(node)] = node
                CG[core.get_path(node)] = []
                PG[core.get_path(node)] = {'int':[], 'outt':[]}
        
        for arc in arcs.keys():
            myArc = arcs[arc]
            if core.is_instance_of(myArc, META['Inarcs']):
                TG[core.get_pointer_path(myArc, 'dst')]['inp'].append(core.get_pointer_path(myArc, 'src'))
                PG[core.get_pointer_path(myArc, 'src')]['outt'].append(core.get_pointer_path(myArc, 'dst'))
            elif core.is_instance_of(myArc, META['outarcs']):
                TG[core.get_pointer_path(myArc, 'src')]['outp'].append(core.get_pointer_path(myArc, 'dst'))
                PG[core.get_pointer_path(myArc, 'dst')]['int'].append(core.get_pointer_path(myArc, 'src'))
            CG[core.get_pointer_path(myArc, 'src')].append(core.get_pointer_path(myArc, 'dst'))
            
        
        def path_search(root, path, path_len, pathlist):
            if root is None:
                return
            
            if len(path) > path_len:
                path[path_len] = root
            else:
                path.append(root)
            
            path_len += 1
            if len(CG[root]) == 0:
                pathlist.append([i for i in path])
            else:
                for neighbor in CG[root]:
                    path_search(neighbor, path, path_len, pathlist)
        
        
        bad_free = False
        for t in TG.keys():
            for j in TG.keys():
                if t != j and len(list(set(TG[t]['inp']) & set(TG[j]['inp']))) > 0:
                    bad_free = True
            
        bad_state = False
        for t in TG.keys():
            if len(TG[t]['inp']) != 1 or len(TG[t]['outp']) != 1:
                bad_state = True
            
        bad_marked = False
        source = None
        srcct = 0
        dest = None
        dstct = 0
        for p in PG.keys():
            if len(PG[p]['int']) != 1 or len(PG[p]['outt']) != 1:
                bad_marked = True
            if len(PG[p]['int']) == 0:
                source = p
                srcct += 1
            if len(PG[p]['outt']) == 0:
                dest = p
                dstct += 1
        
        bad_work = False
        if source is None or srcct != 1 or dest is None or dstct != 1:
            bad_work = True
        else:
            pths = []
            path_search(source, [], 0, pths)
            for pth in pths:
                if pth[-1] != dest:
                    bad_work = True
            for p in PG.keys():
                bad_place = True
                for pth in pths:
                    if p in pth:
                        bad_place = False
                if bad_place:
                    bad_work = True
            for t in TG.keys():
                bad_trans = True
                for pth in pths:
                    if t in pth:
                        bad_trans = False
                if bad_trans:
                    bad_work = True
            
        if not bad_free:
            self.send_notification("Your Petri Net is a Free-choice petri net")
        if not bad_state:
            self.send_notification("Your Petri Net is a State Machine")
        if not bad_marked:
            self.send_notification("Your Petri Net is a Marked Graph")
        if not bad_work:
            self.send_notification("Your Petri Net is a Workflow Net")
