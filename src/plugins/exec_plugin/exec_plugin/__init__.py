"""
This is where the implementation of the plugin code goes.
The exec_plugin-class is imported from both run_plugin.py and run_debug.py
"""
import sys
import logging
from webgme_bindings import PluginBase

# Setup a logger
logger = logging.getLogger('exec_plugin')
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)  # By default it logs to stderr..
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)


class exec_plugin(PluginBase):
    def main(self):
        core = self.core
        root_node = self.root_node
        # active_node = self.active_node
        META = self. META
        active_node = self.active_node
        visited = set()
        states = set()
        graph = {}

        nodes = c0re.load_children(active_node)
        for node in nodes:
            if core.is_type_of(node,META['Places']):
                states.add(core.get_path(node))
            if core.is_type_of(node, META['Arcs']):
                visited.add(core.get_path(node))
        for node in nodes:
            if core.is_type_of(node, META['Transitions']):
                if core.get_pointer_path(node, 'src') in graph:
                    graph[core.get_pointer_path(node, 'src')].append(core.get_pointer_path(node, 'dst'))
                else:
                    graph[core.get_pointer_path(node, 'src')] = [core.get_pointer_path(node, 'dst')]

         # now we just update the visited set
        old_size = len(visited)
        new_size = 0

        while old_size != new_size:
            old_size = len(visited)
            elements = list(visited)
            for element in elements:
                if element in graph:
                    for next_state in graph[element]:
                        visited.add(next_state)
            new_size = len(visited)

         # now we just simply check if we have a difference between the foll set of states and the reachable ones
        if len(states.difference(visited)) == 0:
             # everything is fine
            self.send_notification('Your state machine is well formed')
        else:
             # we need some states that are unreachable
            self.send_notification('Your state machine has unreachable states')





        # active_node = self.active_node	
        # name = core.get_attribute(active_node, 'name')

        # logger.info('ActiveNode at "{0}" has name {1}'.format(core.get_path(active_node), name))

        # core.set_attribute(active_node, 'name', 'newName')

        # commit_info = self.util.save(root_node, self.commit_hash, 'master', 'Python plugin updated the model')
        # logger.info('committed :{0}'.format(commit_info))
