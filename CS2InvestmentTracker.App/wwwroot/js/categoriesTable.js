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
                     <button class="btn btn-primary" onclick="editCategory(${row.id})">Edit</button>
                     <button class="btn btn-danger"  onclick="deleteCategory(${row.id})">Delete</button>
                   </div>`
            }
        ]
    });
}

function bindCategoriesUI() {
    const modalEl = document.getElementById('createCategoryModal');
    if (!modalEl) return;
    const bsModal = new bootstrap.Modal(modalEl);

    $("#btnAddCategory").off('click').on('click', function () {
        $("#createCategoryForm")[0].reset();
        bsModal.show();
    });

    $("#createCategoryForm").off('submit').on('submit', function (e) {
        e.preventDefault();

        const dto = {
            name: $("input[name='name']").val(),
            description: $("input[name='description']").val(),
        };

        $.ajax({
            url: '/api/categories',
            type: 'POST',
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

function createCategory() {
    var categoria = prompt("Nuova categoria:");
    if (!categoria) return;

    var newCategory = {
        name: categoria,
        description: ""
    };

    $.ajax({
        url: '/api/categories',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(newCategory),
        success: function () {
            $('#categoriesTable').DataTable().ajax.reload(null, false);
        },
        error: function (xhr) {
            console.error(xhr.responseText);
            alert("Errore nella creazione");
        }
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

function editCategory(id) {
    $.get('/api/categories/' + id, function (category) {
        var nuovoNome = prompt("Nome:", category.name);
        if (nuovoNome == null) return;

        var nuovaDescrizione = prompt("Descrizione:", category.quantity);

        category.name = nuovoNome;
        category.quantity = parseInt(nuovaDescrizione, 10);

        $.ajax({
            url: '/api/categories/' + id,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(category),
            success: function () {
                $('#categoriesTable').DataTable().ajax.reload(null, false);
            },
            error: function (xhr) {
                console.error(xhr.responseText);
                alert("Errore nell'update");
            }
        });
    });
}
