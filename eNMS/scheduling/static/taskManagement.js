/*
global
alertify: false
fields: false
tasks: false
*/

const table = $('#table').DataTable(); // eslint-disable-line new-cap
const taskManagement = true; // eslint-disable-line no-unused-vars

/**
 * Add a task to the datatable.
 * @param {mode} mode - Create or edit.
 * @param {properties} properties - Properties of the task to add.
 */
function addTask(mode, properties) {
  let values = [];
  for (let i = 0; i < fields.length; i++) {
    if (fields[i] != 'recurrent') {
      values.push(`${properties[fields[i]]}`);
    }
  }
  const status = properties.status == 'active' ? 'pause' : 'resume';
  values.push(
    `<button type="button" class="btn btn-success btn-xs"
    onclick="showTaskModal('${properties.id}')">Edit</button>`,
    `<button id="pause-resume-${properties.id}" type="button"
    class="btn btn-danger btn-xs" onclick="${status}Task('${properties.id}')">
    ${status.charAt(0).toUpperCase() + status.substr(1)}</button>`,
    `<button type="button" class="btn btn-danger btn-xs"
    onclick="deleteTask('${properties.id}')">Delete</button>`
  );

  if (mode == 'edit') {
    table.row($(`#${properties.id}`)).data(values);
  } else {
    const rowNode = table.row.add(values).draw(false).node();
    $(rowNode).attr('id', `${properties.id}`);
  }
}

/**
 * Schedule a task.
 */
function scheduleTask() { // eslint-disable-line no-unused-vars
  if ($('#task-modal-form').parsley().validate()) {
    $.ajax({
      type: 'POST',
      url: '/scheduling/scheduler',
      dataType: 'json',
      data: $('#task-modal-form').serialize(),
      success: function(task) {
        if (!task) {
          alertify.notify('HTTP Error 403 – Forbidden', 'error', 5);
        } else {
          const mode = $('#title').text().startsWith('Edit') ? 'edit' : 'add';
          addTask(mode, task);
          const message = `Task '${task.name}'
          ${mode == 'edit' ? 'edited' : 'created'} !`;
          alertify.notify(message, 'success', 5);
          $('#task-modal').modal('hide');
        }
      },
    });
  } else {
    alertify.notify('Some fields are missing.', 'error', 5);
  }
}

/**
 * Delete a task.
 * @param {id} id - Task id.
 */
function deleteTask(id) { // eslint-disable-line no-unused-vars
  $.ajax({
    type: 'POST',
    url: `/scheduling/delete_task/${id}`,
    success: function(result) {
      if (!result) {
        alertify.notify('HTTP Error 403 – Forbidden', 'error', 5);
      } else {
        table.row($(`#${id}`)).remove().draw(false);
        alertify.notify('Task successfully deleted.', 'success', 5);
      }
    },
  });
}

/**
 * Pause a task.
 * @param {id} id - Task id.
 */
function pauseTask(id) { // eslint-disable-line no-unused-vars
  $.ajax({
    type: 'POST',
    url: `/scheduling/pause_task/${id}`,
    success: function(result) {
      if (!result) {
        alertify.notify('HTTP Error 403 – Forbidden', 'error', 5);
      } else {
        $(`#pause-resume-${id}`).attr(
          'onclick',
          `resumeTask('${id}')`
        ).text('Resume');
        alertify.notify('Task paused.', 'success', 5);
      }
    },
  });
}

/**
 * Resume a task.
 * @param {id} id - Task id.
 */
function resumeTask(id) { // eslint-disable-line no-unused-vars
  $.ajax({
    type: 'POST',
    url: `/scheduling/resume_task/${id}`,
    success: function(result) {
      if (!result) {
        alertify.notify('HTTP Error 403 – Forbidden', 'error', 5);
      } else {
        $(`#pause-resume-${id}`).attr(
          'onclick',
          `pauseTask('${id}')`
        ).text('Pause');
        alertify.notify('Task resumed.', 'success', 5);
      }
    },
  });
}

(function() {
  if (typeof tasks !== 'undefined') {
    for (let i = 0; i < tasks.length; i++) {
      addTask('create', tasks[i]);
    }
  }

  const dates = ['start_date', 'end_date'];
  const today = new Date();
  for (let i = 0; i < dates.length; i++) {
    $('#' + dates[i]).datetimepicker({
      format: 'DD/MM/YYYY HH:mm:ss',
      widgetPositioning: {
        horizontal: 'left',
        vertical: 'bottom',
      },
      useCurrent: false,
    });
    if ($('#' + dates[i]).length) {
      $('#' + dates[i]).data('DateTimePicker').minDate(today);
    }
  }
})();
