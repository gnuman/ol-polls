var $content = $('#content');
var update, save, removeHandler, makeChangeHandler, addHandler;
var newItem;
var checklist;

// create a universally unique id
uuid = function() {
    var _uuid = function(ph) {
        if (ph) {
            return (ph ^ Math.random() * 16 >> ph/4).toString(16);
        } else {
            return (
                    [1e7] + // 10000000 +
                    -1e3  + // -1000 +
                    -4e3  + // -4000 +
                    -8e3  + // -80000000 +
                    -1e11   // -100000000000,
                ).replace(
                    /[018]/g, // zeroes, ones, and eights with
                    _uuid     // random hex digits
            );
        }
    };

    return _uuid();
};

// build the checklist UI
update = function() {
    $content.empty();
    $.each(checklist, function(i, item) {
        var $input = $('<input>', {'type': 'text', 'class': 'item-text'}).val(item.text);
        var $remove = $('<button>', {'class': 'btn btn-default btn-flat btn-remove'}).html('&times;');
        var $item = $('<div>', {'class': 'checkbox'})
            .append(
                $('<label>')
                    .append(
                        $('<input>', {
                            'type': 'radio',
                            'id': item.id,
                            'name': 'olvote'
                        }).prop('checked', true) //.prop('disabled', true)
                    )
                  /*  .append(
                        $('<span>', {'class': 'checkbox-material'})
                            .append($('<span>', {'class': 'check'}))
                    ) */
                    .append($input)
            )
            .append($remove)
        ;

        $input.data( 'parent', $item).data('index', i);
        $remove.data('parent', $item).data('index', i);

        if (i !== 0) {
            $remove.hide();
        }

        $remove.on('click', removeHandler);

        $input.on('keyup change', makeChangeHandler());

        $content.append($item);
    });

    var $removals = $content.find('.btn-remove');
    $removals.show();
    
    if ($removals.length === 1) {
        $removals.first().hide();
    }
};

// saves the checklist and comparison criteria
save = function(callback) {
    var callbacksDone = 0;
    var done = function() {
        if (callbacksDone === 2) {
            callback && callback();
        }
    };
    var getCriteria = function(item) {
        return [item.id, true];
    };

    // save the checklist
    OL.setup.replace({
        'checklist': checklist
    }, function(result) {
        checklist = result.data.checklist;
        callbacksDone++;
        done();
    });

    // save the criteria for completion
    /* an object of:
        {
            'item-id-1': true,
            'item-id-2': true
        }
       for each item
    */
    OL.setCriteria(_.zipObject(_.map(checklist, getCriteria)), function() {
        callbacksDone++;
        done();
    });
};

// saves the done message (only)
saveDoneMessage = function(message, callback) {
    OL.setup.replace({
        'doneMessage': message
    }, function(result) {
        callback && callback();
    });
};

// create a change handler that's debounced, for editing items
makeChangeHandler = function() {
    var changeHandler = function() {
        var $input = $(this);
        var listIndex = $input.data('index');
        checklist[listIndex].text = $input.val();
        save(function() {
            $input.removeClass('saving').prev('.checkbox-material').removeClass('saving');
        });
    };

    var debouncedChangeHandler = _.debounce(changeHandler, 600);

    return function() {
        var $input = $(this);

        if ($input.data('lastVal') !== $input.val()) {
            $input.data('lastVal', $input.val());
            $input.addClass('saving').prev('.checkbox-material').addClass('saving');
            debouncedChangeHandler.call(this);
        }
    };
};

// remove an item from the list
removeHandler = function() {
    var updates = {};
    var $btn = $(this);
    var $item = $btn.data('parent');
    var listIndex = $btn.data('index');
    
    checklist.splice(listIndex, 1);

    $item.addClass('deleting');
    save(function() {
        $item.remove();
        update();
    });
};

// create a new item
newItem = function() {
    return [
        {'id': uuid(), 'text': "Jurrasic Park"},
        {'id': uuid(), 'text': "Back to future"}
    ];
};

// handler for adding new items to the list
addHandler = function() {
    checklist.push(newItem());
    $('input.item-text').prop('disabled', true);
    save(function() {
        update();
    });
};

// when the OL API is ready
OL(function() {
    // load the checklist from setup data, or just create a new item if there is none
    checklist = OL.setup.data.checklist || newItem();

    // redraw the list
    update();

    // add a click handler to the "+ add" button
    $('button.btn-add').on('click', addHandler);

    // add a debounced change handler to the "done" message text input
    var debouncedSave = _.debounce(function($input) {
        saveDoneMessage($input.val(), function() {
            $input.removeClass('saving'); // it's saved, remove the saving look
        });
    }, 600);
    $('input.done-text').on('keyup change', function() {
        var $input = $(this);

        if ($input.data('lastVal') !== $input.val()) {
            $input.data('lastVal', $input.val());
            $input.addClass('saving'); // show it as saving
            debouncedSave($input); 
        }
    }).val(OL.setup.data.doneMessage || '');

    // when this widget changes back to view mode, do another save of everything
    OL.on('save', function() {
        OL.setup.replace({
            'checklist': checklist,
            'votingLabel': $('input.vote-text').val()
        });
    });
});
