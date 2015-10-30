var numCompleted, numTotal, itemClickHandler, update, state;

itemClickHandler = function() {
    var $item = $(this);
    var updates = {};
    var isChecked = $item.prop('checked');
    updates[$item.attr('id')] = isChecked;
    state[$item.attr('id')] = isChecked;

    // tell OpenLearning that there was some kind of interaction
    OL.user.logInteraction();

    // update the user's saved state
    $item.addClass('saving');
    OL.user.update({'checked': updates}, 'set', function() {
        $item.removeClass('saving');
        if (isChecked) {
            numCompleted++;
        } else {
            numCompleted--;
        }

        // submit an object of all item states e.g. 
        /*
            {
                'item-id-1': true,
                'item-id-2': false
            }
          to compare against the completion criteria
          (to update the user's progress)
        */
        OL.user.submit(state);

        // update the UI
        update();
    });
};

votingHandler = function(){
    alert("hi");
};



OL(function() {
    var $content = $('#content');
    var $votingName = $('#voting-name');
    var $votingButton = $('#voting-button');
    
    var checklist = OL.setup.data.checklist || [{'id': '1', 'text': "Jurrasic Park"},
                                                {'id': '2', 'text': "Back to future"}
                                               ];

    var votingHeadline  = OL.setup.data.votingHeadline || "Which is your favourite Movie?" ;
    $votingName.text(votingHeadline);

    var votingLabel = OL.setup.data.votingLabel || "Vote" ;
    $votingButton.html(votingLabel);

    state = OL.user.data.checked || {};
    // build the checklist
    $.each(checklist, function(i, item) {
        var $item = $('<div>', {'class': 'checkbox'})
            .append(
                $('<label>')
                    .append(
                        $('<input>', {
                            'type': 'radio',
                            'id': item.id,
                            'name': 'olvote'
                        }).prop('checked', Boolean(state[item.id]))
                    )
                    /*
                    .append(
                        $('<span>', {'class': 'checkbox-material'})
                            .append($('<span>', {'class': 'check'}))
                    )*/
                    .append(
                        $('<span>', {'class': 'item-text'}).text(item.text)
                    )
            );

        $content.append($item);
    });
    
    $votingButton.on('click', votingHandler);
});
