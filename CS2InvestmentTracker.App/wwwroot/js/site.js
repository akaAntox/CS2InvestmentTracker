// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.ù

var itemsJsGrid = $('#ItemsJsGrid');
var items = JSON.parse(itemsJsGrid.attr('data-items'));

var categories = [
    { Name: "Stockholm 2021", Id: 0 },
    { Name: "Capsule", Id: 1 },
    { Name: "RMR 2020", Id: 2 },
    { Name: "Prova", Id: 3 }
];

$("#ItemsJsGrid").jsGrid({
    width: "100%",
    height: "400px",

    inserting: true,
    editing: true,
    sorting: true,
    paging: true,

    data: items,

    fields: [
        { name: "Name", type: "text", width: 150, validate: "required" },
        { name: "Quantity", type: "number", width: 30 },
        { name: "BuyPrice", type: "number", width: 30 },
        { name: "MinSellPrice", type: "number", width: 30 },
        { name: "AvgSellPrice", type: "number", width: 30 },
        { name: "Category", type: "select", items: categories, valueField: "Id", textField: "Name" },
        { type: "control" }
    ]
});