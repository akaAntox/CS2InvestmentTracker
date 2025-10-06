let itemsDt = null;
function initBsTooltips(scope) {
    const $els = scope.find('[data-bs-toggle="tooltip"]');

    $els.each(function () {
        const existing = bootstrap.Tooltip.getInstance(this);
        if (existing) existing.dispose();
    });
}

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
            //{ data: 'category.name' },
            { data: 'name' },
            { data: 'quantity' },
            { data: 'buyPrice', render: (d) => d.toFixed(2) + ' €' },
            { data: 'minSellPrice', render: (d) => d.toFixed(2) + ' €' },
            { data: 'netProfit', render: (d) => d.toFixed(3) + ' €' },
            //{ data: 'avgSellPrice' },
            {
                data: null,
                render: (d, _, row) => {
                    const dateValue = row.editDate || row.insertDate;
                    return dateValue ? new Date(dateValue).toLocaleString(undefined, {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : '';
                }
            },
            //{
            //    data: 'editDate',
            //    render: (d) => d ? new Date(d).toLocaleString() : ''
            //},
            {
                data: null,
                orderable: false,
                searchable: false,
                render: (_, __, row) =>
                   `<div class="btn-group btn-group-sm">
                     <button name="btnEditItem" class="btn btn-primary" data-bs-toggle="tooltip" title="Edit">
                        <i class="fas fa-pencil"></i>
                     </button>
                     <button name="btnDeleteItem" class="btn btn-danger" data-bs-toggle="tooltip" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                     </button>
                     <button name="btnUpdatePricesItem" class="btn btn-warning" data-bs-toggle="tooltip" title="Update price">
                        <i class="fas fa-sync text-white"></i>
                     </button>
                   </div>`
            }
        ],
        initComplete: function () {
            initBsTooltips($('#itemsTable'));
        },
        drawCallback: function () {
            initBsTooltips($('#itemsTable'));
        }
    });
}

function initItemsForm() {
    const form = $("#createItemForm");
    if (form.length === 0) return;

    form[0].reset();

    $.ajax({
        url: '/api/categories',
        type: 'GET',
        success: function (data) {
            const select = form.find("select[name='categories']");
            select.empty();
            const opt = new Option('-- Select Category --', '');
            opt.disabled = true;
            select.append(opt);
            for (const cat of data) {
                select.append(new Option(cat.name, cat.id));
            }
        },
        error: function (xhr) {
            console.error(xhr.responseText);
            alert("Errore nel caricamento delle categorie");
        }
    })
}

function bindItemsUI() {
    const modalEl = $('#createItemModal');
    if (!modalEl) return;
    const form = $("#createItemForm");
    if (form.length === 0) return;
    const bsModal = new bootstrap.Modal(modalEl);

    //Reset on close
    modalEl.on('hidden.bs.modal', function () {
        form[0].reset();
        form.find("input[name='id']").val('').removeAttr('value');
        form.find("#createItemError").addClass('d-none').text('');
        form.find("#createItemSubmit").prop('disabled', false);
    });

    //Add item
    $("#btnAddItem").off('click').on('click', function () {
        form[0].reset();
        form.find(".modal-title").text("Add Item");
        form.find("input[name='id']").val('').removeAttr('value');
        bsModal.show();
    });

    //Edit item
    $('#itemsTable').off('click', "button[name='btnEditItem']").on('click', "button[name='btnEditItem']", function () {
        form[0].reset();
        form.find(".modal-title").text("Edit Item");
        const data = itemsDt.row($(this).closest('tr')).data();
        if (!data) return;
        $("input[name='id']").val(data.id);
        $("input[name='name']").val(data.name);
        $("select[name='categories']").val(data.categoryId);
        $("input[name='description']").val(data.description);
        $("input[name='quantity']").val(data.quantity);
        $("input[name='buyPrice']").val(data.buyPrice);
        bsModal.show();
    });

    //Delete item
    $('#itemsTable').off('click', "button[name='btnDeleteItem']").on('click', "button[name='btnDeleteItem']", function () {
        const data = itemsDt.row($(this).closest('tr')).data();
        if (!data) return;
        deleteItem(data.id);
    });

    //Update price on item
    $('#itemsTable').off('click', "button[name='btnUpdatePricesItem']").on('click', "button[name='btnUpdatePricesItem']", function () {
        const data = itemsDt.row($(this).closest('tr')).data();
        if (!data) return;
        const btn = $(this);
        btn.prop('disabled', true);
        $.ajax({
            url: '/api/steam/' + data.id,
            type: 'POST',
            contentType: 'application/json',
            success: function () {
                if (itemsDt) itemsDt.ajax.reload(null, false);
            },
            error: function (xhr) {
                console.error(xhr.responseText);
                alert("Errore nell'aggiornamento del prezzo");
            },
            complete: function () {
                btn.prop('disabled', false);
            }
        });
    });

    //Submit form
    $("#createItemForm").off('submit').on('submit', function (e) {
        e.preventDefault();

        const id = $("input[name='id']").val();
        const dto = {
            name: $("input[name='name']").val(),
            categoryId: Number.parseInt($("select[name='categories']").val()) || 0,
            description: $("textarea[name='description']").val(),
            quantity: Number.parseInt($("input[name='quantity']").val(), 10) || 0,
            buyPrice: Number.parseFloat($("input[name='buyPrice']").val()) || 0,
            ...(id ? { id: Number.parseInt($("input[name='id']").val(), 10) } : {})
        };

        $.ajax({
            url: '/api/items',
            type: id ? 'PUT' : 'POST',
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