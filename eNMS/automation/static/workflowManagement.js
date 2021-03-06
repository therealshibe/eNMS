/*
global
alertify: false
fields: false
workflows: false
*/

const table = $('#table').DataTable(); // eslint-disable-line new-cap

(function() {
  $('#devices').fSelect({
    placeholder: 'Select devices',
    numDisplayed: 5,
    overflowText: '{n} devices selected',
    noResultsText: 'No results found',
  });
})();

/**
 * Add workflow to the datatable.
 * @param {mode} mode - Create or edit.
 * @param {properties} properties - Properties of the workflow.
 */
function addWorkflow(mode, properties) {
  let values = [];
  for (let i = 0; i < fields.length; i++) {
    values.push(`${properties[fields[i]]}`);
  }
  values.push(
    `<button type="button" class="btn btn-info btn-xs"
    onclick="showLogs('${properties.id}')"></i>Logs</a></button>`,
    `<button type="button" class="btn btn-info btn-xs"
    onclick="compareLogs('${properties.id}')"></i>Compare</a></button>`,
    `<button type="button" class="btn btn-info btn-xs"
    onclick="showWorkflowModal('${properties.id}')">Edit</button>`,
    `<button type="button" class="btn btn-success btn-xs"
    onclick="runJob('${properties.id}')">Run</button>`,
    `<button type="button" class="btn btn-danger btn-xs"
    onclick="deleteWorkflow('${properties.id}')">Delete</button>`
  );
  if (mode == 'edit') {
    table.row($(`#${properties.id}`)).data(values);
  } else {
    const rowNode = table.row.add(values).draw(false).node();
    $(rowNode).attr('id', `${properties.id}`);
  }
}

(function() {
  for (let i = 0; i < workflows.length; i++) {
    addWorkflow('create', workflows[i]);
  }
})();

/**
 * Open the workflow modal for creation.
 */
function showModal() { // eslint-disable-line no-unused-vars
  $('#title').text('Create a New Workflow');
  $('#edit-form').trigger('reset');
  $('#edit').modal('show');
}

/**
 * Open the workflow modal for editing.
 * @param {id} id - Id of the workflow to edit.
 */
function showWorkflowModal(id) { // eslint-disable-line no-unused-vars
  $('#title').text(`Edit Workflow`);
  $.ajax({
    type: 'POST',
    url: `/automation/get/${id}`,
    success: function(properties) {
      if (!properties) {
        alertify.notify('HTTP Error 403 – Forbidden', 'error', 5);
      } else {
        for (const [property, value] of Object.entries(properties)) {
          $(`#${property}`).val(value);
        }
        $('.fs-option').removeClass('selected');
        $('.fs-label').text('Select devices');
        properties.devices.map(
          (n) => $(`.fs-option[data-value='${n.id}']`).click()
        );
        $('#pools').val(properties.pools.map((p) => p.id));
      }
    },
  });
  $(`#edit`).modal('show');
}

/**
 * Edit a workflow.
 */
function editObject() { // eslint-disable-line no-unused-vars
  if ($('#edit-form').parsley().validate() ) {
    $.ajax({
      type: 'POST',
      url: `/automation/edit_workflow`,
      dataType: 'json',
      data: $('#edit-form').serialize(),
      success: function(properties) {
        if (!properties) {
          alertify.notify('HTTP Error 403 – Forbidden', 'error', 5);
        } else {
          const mode = $('#title').text().startsWith('Edit') ? 'edit' : 'add';
          addWorkflow(mode, properties);
          const message = `Workflow ${properties.name};
          ${mode == 'edit' ? 'edited' : 'created'}.`;
          alertify.notify(message, 'success', 5);
        }
      },
    });
    $(`#edit`).modal('hide');
  }
}

/**
 * Delete a workflow.
 * @param {id} id - Id of the workflow to delete.
 */
function deleteWorkflow(id) { // eslint-disable-line no-unused-vars
  $.ajax({
    type: 'POST',
    url: `/automation/delete/${id}`,
    success: function(workflow) {
      if (!workflow) {
        alertify.notify('HTTP Error 403 – Forbidden', 'error', 5);
      } else {
        table.row($(`#${id}`)).remove().draw(false);
        alertify.notify(`Workflow '${workflow.name}' deleted.`, 'error', 5);
      }
    },
  });
}
