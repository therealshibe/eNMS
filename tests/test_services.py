from eNMS.automation.models import Service, service_classes
from tests.test_base import check_blueprints
from werkzeug.datastructures import ImmutableMultiDict

# test the creation of configuration service (netmiko / napalm)
# test the creation of file transfer service (netmiko via SCP)
# test the creation of ansible service


netmiko_ping = ImmutableMultiDict([
    ('name', 'netmiko_ping'),
    ('waiting_time', '0'),
    ('devices', '1'),
    ('devices', '2'),
    ('description', ''),
    ('vendor', ''),
    ('operating_system', ''),
    ('content_type', 'simple'),
    ('content', 'ping 1.1.1.1'),
    ('netmiko_type', 'show_commands'),
    ('driver', 'cisco_xr_ssh'),
    ('global_delay_factor', '1.0')
])

file_transfer_service = ImmutableMultiDict([
    ('name', 'test'),
    ('waiting_time', '0'),
    ('devices', '1'),
    ('devices', '2'),
    ('description', ''),
    ('vendor', ''),
    ('operating_system', ''),
    ('driver', 'cisco_ios'),
    ('source_file', 'path/to/source'),
    ('dest_file', 'path/to/destination'),
    ('file_system', 'flash:'),
    ('direction', 'put')
])


@check_blueprints('/automation')
def test_base_services(user_client):
    user_client.post(
        '/automation/save_service/netmiko_configuration_service',
        data=netmiko_ping
    )
    assert len(
        service_classes['netmiko_configuration_service'].query.all()
    ) == 3
    assert len(Service.query.all()) == 14
    user_client.post(
        'automation/save_service/netmiko_file_transfer_service',
        data=file_transfer_service
    )
    assert len(
        service_classes['netmiko_file_transfer_service'].query.all()
    ) == 1
    assert len(Service.query.all()) == 15


getters_dict = ImmutableMultiDict([
    ('name', 'napalm_getters_service'),
    ('description', ''),
    ('driver', 'ios'),
    ('getters', 'get_interfaces'),
    ('getters', 'get_interfaces_ip'),
    ('getters', 'get_lldp_neighbors')
])


@check_blueprints('/automation')
def test_getters_service(user_client):
    user_client.post(
        '/automation/save_service/napalm_getters_service',
        data=getters_dict
    )
    assert len(service_classes['napalm_getters_service'].query.all()) == 5


ansible_service = ImmutableMultiDict([
    ('name', 'testttt'),
    ('waiting_time', '0'),
    ('devices', '1'),
    ('devices', '2'),
    ('description', ''),
    ('vendor', ''),
    ('operating_system', ''),
    ('playbook_path', 'test.yml'),
    ('arguments', '--ask-vault')
])


@check_blueprints('/automation')
def test_ansible_services(user_client):
    user_client.post(
        '/automation/save_service/ansible_playbook_service',
        data=ansible_service
    )
    assert len(service_classes['ansible_playbook_service'].query.all()) == 1
    assert len(Service.query.all()) == 14
