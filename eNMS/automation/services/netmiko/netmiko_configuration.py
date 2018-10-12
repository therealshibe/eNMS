from multiprocessing.pool import ThreadPool
from sqlalchemy import Column, Float, ForeignKey, Integer, String

from eNMS.automation.helpers import netmiko_connection, NETMIKO_DRIVERS
from eNMS.automation.models import Service, service_classes


class NetmikoConfigurationService(Service):

    __tablename__ = 'NetmikoConfigurationService'

    id = Column(Integer, ForeignKey('Service.id'), primary_key=True)
    has_targets = True
    vendor = Column(String)
    operating_system = Column(String)
    content = Column(String)
    driver = Column(String)
    driver_values = NETMIKO_DRIVERS
    global_delay_factor = Column(Float, default=1.)

    __mapper_args__ = {
        'polymorphic_identity': 'netmiko_configuration_service',
    }

    def job(self, device, results, payload):
        netmiko_handler = netmiko_connection(self, device)
        netmiko_handler.send_config_set(self.content.splitlines())
        netmiko_handler.disconnect()
        return {'success': True, 'result': 'configuration OK'}


service_classes['netmiko_configuration_service'] = NetmikoConfigurationService