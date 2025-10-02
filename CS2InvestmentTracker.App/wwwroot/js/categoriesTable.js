let categoriesDt = null;

function initCategoriesTable() {
    if (categoriesDt) {
        categoriesDt.destroy();
        categoriesDt = null;
    }

    categoriesDt = new DataTable('#categoriesTable', {
        ajax: { url: '/api/categories', type: 'GET', dataSrc: '' },
        pageLength: 25,
        responsive: true,
        columns: [
            { data: 'name' },
            { data: 'description' },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: (_, __, row) =>
                   `<div class="btn-group btn-group-sm">
                     <button name="btnEditCategory" class="btn btn-primary" data-bs-toggle="tooltip" title="Edit">
                        <i class="fas fa-pencil"></i>
                     </button>
                     <button name="btnDeleteCategory" class="btn btn-danger" data-bs-toggle="tooltip" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                     </button>
                   </div>`
            }
        ]
    });
}

function bindCategoriesUI() {
    const modalEl = $('#createCategoryModal');
    if (!modalEl) return;
    const bsModal = new bootstrap.Modal(modalEl);
    const form = $("#categoryForm");

    //Reset on close
    modalEl.on('hidden.bs.modal', function () {
        form[0].reset();
        form.find("input[name='id']").val('').removeAttr('value');
        form.find("#createCategoryError").addClass('d-none').text('');
        form.find("#createCategorySubmit").prop('disabled', false);
    });

    //Add category
    $("#btnAddCategory").off('click').on('click', function () {
        form[0].reset();
        form.find(".modal-title").text("Add Category");
        form.find("input[name='id']").val('').removeAttr('value');
        bsModal.show();
    });

    //Edit category
    $('#categoriesTable').off('click', "button[name='btnEditCategory']").on('click', "button[name='btnEditCategory']", function () {
        form[0].reset();
        form.find(".modal-title").text("Edit Category");
        const data = categoriesDt.row($(this).closest('tr')).data();
        if (!data) return;
        $("input[name='id']").val(data.id);
        $("input[name='name']").val(data.name);
        $("input[name='description']").val(data.description);
        bsModal.show();
    });

    //Delete category
    $('#categoriesTable').off('click', "button[name='btnDeleteCategory']").on('click', "button[name='btnDeleteCategory']", function () {
        const data = categoriesDt.row($(this).closest('tr')).data();
        if (!data) return;
        deleteCategory(data.id);
    });

    //Submit form
    $("#categoryForm").off('submit').on('submit', function (e) {
        e.preventDefault();

        const id = $("input[name='id']").val();
        const dto = {
            name: $("input[name='name']").val(),
            description: $("input[name='description']").val(),
            ...(id ? { id: parseInt($("input[name='id']").val(), 10) } : {})
        };

        $.ajax({
            url: '/api/categories',
            type: id ? 'PUT' : 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dto),
            success: function () {
                bsModal.hide();
                if (categoriesDt) categoriesDt.ajax.reload(null, false);
            },
            error: function (xhr) {
                alert("Errore: " + xhr.responseText);
            }
        });
    });
}

function deleteCategory(id) {
    if (!confirm("Vuoi davvero eliminare la categoria #" + id + "?")) return;

    $.ajax({
        url: '/api/categories/' + id,
        type: 'DELETE',
        contentType: 'application/json',
        success: function () {
            $('#categoriesTable').DataTable().ajax.reload(null, false);
        },
        error: function (xhr) {
            console.error(xhr.responseText);
            alert("Errore nell'eliminazione");
        }
    });
}