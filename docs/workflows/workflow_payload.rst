================
Workflow Payload
================

Job dependency
--------------

One of the property of workflows in eNMS is that a job will not start unless all of its "predecessors" jobs have been executed.

In the example below, the job ``process_payload1`` has two "predecessors" jobs:
  - ``get_interfaces``
  - ``get_config``

It will not run until ``get_interfaces`` and ``get_config`` have been executed.

.. image:: /_static/workflows/other_workflows/payload_transfer_workflow.png
   :alt: Payload Transfer Workflow
   :align: center

Payload transfer
----------------

The most important characteristic of workflows is the transfer of data between job. When a job starts, it is provided with the results of ALL jobs in the workflow that have already been executed (and not only the results of its "predecessors").

The base code for a job function is the following:

::

  def job(self, payload):
      # The "job" function is called when the service is executed.
      # The parameters of the service can be accessed with self (self.vendor,
      # self.boolean1, etc)
      # You can look at how default services (netmiko, napalm, etc.) are
      # implemented in the /services subfolders (/netmiko, /napalm, etc).
      # "results" is a dictionnary that will be displayed in the logs.
      # It must contain at least a key "success" that indicates whether
      # the execution of the service was a success or a failure.
      # In a workflow, the "success" value will determine whether to move
      # forward with a "Success" edge or a "Failure" edge.
      return {'success': True, 'result': 'example'}

The dictionnary that is returned by ``job`` is the payload of the job, i.e the information that will be transferred to the next jobs to run in the workflow. It MUST contain a key ``success``, to tell eNMS whether the job was considered a success or not (therefore influencing how to move forward in the workflow: either via a ``Success`` edge or a ``Failure`` edge).
  
The last argument of the ``job`` function is ``payload``: it is a dictionnary that contains the results of all jobs that have already been executed.

If we consider the aforementioned workflow, the job ``process_payload1`` receives the variable ``payload`` that contains the results of all other jobs in the workflow (because it is the last one to be executed).

The results of the job ``get_facts`` is the following:

::

  "get_facts": {
      "success": true,
      "devices": {
          "router8": {
              "success": true,
              "result": {
                  "get_facts": {
                      "uptime": 60,
                      "vendor": "Cisco",
                      "os_version": "1841 Software (C1841-SPSERVICESK9-M), Version 12.4(8), RELEASE SOFTWARE (fc1)",
                      "serial_number": "FHK111813HZ",
                      "model": "1841",
                      "hostname": "test",
                      "fqdn": "test.pynms.fr",
                      "interface_list": [
                          "FastEthernet0/0",
                          "FastEthernet0/1",
                          "Serial0/0/0",
                          "Loopback22",
                          "Loopback100"
                      ]
                  }
              }
          }
      }
  },

Consequently, the ``payload`` variable received by ``process_payload1`` will look like this:

::

  {
    "get_facts": {
        "success": true,
        "devices": {
            "router8": {
                "success": true,
                "result": {
                    "get_facts": {
                        "uptime": 60,
                        "vendor": "Cisco",
                        "os_version": "1841 Software (C1841-SPSERVICESK9-M), Version 12.4(8), RELEASE SOFTWARE (fc1)",
                        "serial_number": "FHK111813HZ",
                        "model": "1841",
                        "hostname": "test",
                        "fqdn": "test.pynms.fr",
                        "interface_list": [
                            "FastEthernet0/0",
                            "FastEthernet0/1",
                            "Serial0/0/0",
                            "Loopback22",
                            "Loopback100"
                        ]
                    }
                }
            }
        }
    },
    "get_interfaces": {...},
    "get_config": {...},
    etc...
  }

If we want to use the results of the Napalm getters in the final job ``process_payload1``, here's what the the ``job`` function of ``process_payload1`` could look like:

::

  def job(self, payload):
      get_int = payload['get_interfaces']
      r8_int = get_int['devices']['router8']['result']['get_interfaces']
      speed_fa0 = r8_int['FastEthernet0/0']['speed']
      speed_fa1 = r8_int['FastEthernet0/1']['speed']
      same_speed = speed_fa0 == speed_fa1

      get_facts = payload['get_facts']
      r8_facts = get_facts['devices']['router8']['result']['get_facts']
      uptime_less_than_50000 = r8_facts['uptime'] < 50000
      return {
          'success': True,
          'result': {
              'same_speed_fa0_fa1': same_speed,
              'uptime_less_5000': uptime_less_than_50000
          }
      }

This ``job`` function reuses the Napalm getters of two jobs of the worflow (one of which, ``get_facts``, is not a direct predecessor of ``process_payload1``) to create new variables and inject them in the results.

Use of a SwissArmyKnifeService instance to process the payload
--------------------------------------------------------------

When the only purpose of a function is to process the payload to build a "result" set or simply to determine whether the workflow is a "success" or not, the service itself does not have have any variable "parameters". It is not necessary to create a new Service (and therefore a new class, in a new file) for each of them. Instead, you can group them all in the SwissArmyKnifeService class, and add a method called after the name of the instance. The SwissArmyKnifeService class acts as a "job multiplexer" (see the ``SwissArmyKnifeService`` section of the doc).

This is what the SwissArmyKnifeService class would look like with the last example:

::

  class SwissArmyKnifeService(Service):
  
      __tablename__ = 'SwissArmyKnifeService'
  
      id = Column(Integer, ForeignKey('Service.id'), primary_key=True)
      has_targets = Column(Boolean)
  
      __mapper_args__ = {
          'polymorphic_identity': 'swiss_army_knife_service',
      }
  
      def job(self, *args):
          return getattr(self, self.name)(*args)
  
      # Instance call "job1" with has_targets set to True
      def job1(self, device, payload):
          return {'success': True, 'result': ''}
  
      # Instance call "job2" with has_targets set to False
      def job2(self, payload):
          return {'success': True, 'result': ''}
  
      def process_payload1(self, payload):
          get_int = payload['get_interfaces']
          r8_int = get_int['devices']['router8']['result']['get_interfaces']
          speed_fa0 = r8_int['FastEthernet0/0']['speed']
          speed_fa1 = r8_int['FastEthernet0/1']['speed']
          same_speed = speed_fa0 == speed_fa1
  
          get_facts = payload['get_facts']
          r8_facts = get_facts['devices']['router8']['result']['get_facts']
          uptime_less_than_50000 = r8_facts['uptime'] < 50000
          return {
              'success': True,
              'result': {
                  'same_speed_fa0_fa1': same_speed,
                  'uptime_less_5000': uptime_less_than_50000
              }
          }

From the web UI, you can then create an instance of ``SwissArmyKnifeService`` called ``process_payload1``, and add that job in the workflow. When the job is called, eNMS will automatically use the ``process_payload1`` method, and process the payload accordingly.
