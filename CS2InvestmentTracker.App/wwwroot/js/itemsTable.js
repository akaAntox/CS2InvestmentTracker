let itemsDt = null;

function initItemsTable() {
    if (itemsDt) {
        itemsDt.destroy();
        itemsDt = null;
    }

    itemsDt = new DataTable('#itemsTable', {
        ajax: { url: '/api/items', type: 'GET', dataSrc: '' },
        pageLength: 25,
        responsive: true,
        columns: [
            { data: 'category' },
            { data: 'name' },
            { data: 'quantity' },
            { data: 'buyPrice' },
            { data: 'minSellPrice' },
            { data: 'avgSellPrice' },
            {
                data: 'insertDate',
                render: (d) => d ? new Date(d).toLocaleString() : ''
            },
            {
                data: 'editDate',
                render: (d) => d ? new Date(d).toLocaleString() : ''
            },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: (_, __, row) =>
                    `<div class="btn-group btn-group-sm">
                     <button class="btn btn-primary" onclick="editItem(${row.id})">Edit</button>
                     <button class="btn btn-danger"  onclick="deleteItem(${row.id})">Delete</button>
                   </div>`
            }
        ]
    });
}

function bindItemsUI() {
    const modalEl = document.getElementById('createItemModal');
    if (!modalEl) return;
    const bsModal = new bootstrap.Modal(modalEl);

    $("#btnAddItem").off('click').on('click', function () {
        $("#createItemForm")[0].reset();
        bsModal.show();
    });

    $("#createItemForm").off('submit').on('submit', function (e) {
        e.preventDefault();

        const dto = {
            name: $("input[name='name']").val(),
            category: $("input[name='category']").val(),
            quantity: parseInt($("input[name='quantity']").val(), 10) || 0
        };

        $.ajax({
            url: '/api/items',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dto),
            success: function () {
                bsModal.hide();
                if (itemsDt) itemsDt.ajax.reload(null, false);
            },
            error: function (xhr) {
                alert("Errore: " + xhr.responseText);
            }
        });
    });
}

function createItem() {
    var nome = prompt("Nuovo item:");
    if (!nome) return;

    var newItem = {
        name: nome,
        quantity: 0,
        buyPrice: 0,
        minSellPrice: 0,
        avgSellPrice: 0,
        category: ""
    };

    $.ajax({
        url: '/api/items',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(newItem),
        success: function () {
            $('#itemsTable').DataTable().ajax.reload(null, false);
        },
        error: function (xhr) {
            console.error(xhr.responseText);
            alert("Errore nella creazione");
        }
    });
}

function deleteItem(id) {
    if (!confirm("Vuoi davvero eliminare l'item #" + id + "?")) return;

    $.ajax({
        url: '/api/items/' + id,
        type: 'DELETE',
        contentType: 'application/json',
        success: function () {
            $('#itemsTable').DataTable().ajax.reload(null, false);
        },
        error: function (xhr) {
            console.error(xhr.responseText);
            alert("Errore nell'eliminazione");
        }
    });
}

function editItem(id) {
    $.get('/api/items/' + id, function (item) {
        var nuovoNome = prompt("Nome:", item.name);
        if (nuovoNome == null) return;

        var nuovoQty = prompt("Quantità:", item.quantity);

        item.name = nuovoNome;
        item.quantity = parseInt(nuovoQty, 10);

        $.ajax({
            url: '/api/items',
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(item),
            success: function () {
                $('#itemsTable').DataTable().ajax.reload(null, false);
            },
            error: function (xhr) {
                console.error(xhr.responseText);
                alert("Errore nell'update");
            }
        });
    });
}
