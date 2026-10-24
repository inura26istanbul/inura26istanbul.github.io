/* Static (archived) version of the INURA 2026 interactive programme.
 * Same layout as the original theme code, but reads the data embedded in
 * program-data.js instead of calling the WordPress server.
 * Registration and WhatsApp buttons are shown but disabled. */
(function ($) {
    'use strict';

    var DATA = window.INURA_PROGRAM_ARCHIVE || { program: {}, details: {} };
    var DISABLED_TITLE = 'Registration is closed. This is an archived page.';

    var days = [
        { id: 1, label: 'Wed, 3rd June' },
        { id: 2, label: 'Thu, 4th June' },
        { id: 3, label: 'Fri, 5th June' },
        { id: 4, label: 'Sat, 6th June' },
        { id: 5, label: 'Sun, 7th June' },
        { id: 6, label: 'Mon, 8th June' }
    ];

    function render() {
        var events = DATA.program || {};

        if (!$('#inura-program-style').length) {
            $('head').append('<style id="inura-program-style">.program-columns-wrapper { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; width: 100%; } .program-day-column { min-width: 0; } @media (max-width: 992px) { .program-columns-wrapper { display: flex; overflow-x: auto; } .program-day-column { min-width: 160px; } }'
                + ' .archive-btn-disabled { opacity: .55; cursor: not-allowed !important; pointer-events: none; }</style>');
        }

        var html = '<div class="program-columns-wrapper">';
        days.forEach(function (day) {
            html += '<div class="program-day-column" style="background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; padding: 4px; display:flex; flex-direction:column;">';
            html += '<h3 style="text-align: center; font-size: 12px; font-weight:bold; background: #2c3e50; color: #fff; padding: 6px 2px; margin: -4px -4px 8px -4px; border-radius: 4px 4px 0 0;">' + day.label + '</h3>';

            var dayEvents = events[day.id] || [];
            if (dayEvents.length === 0) {
                html += '<p style="text-align: center; color: #95a5a6; font-style: italic; font-size:0.75em; margin:5px 0;">No events</p>';
            } else {
                dayEvents.forEach(function (event) {
                    var isFull = Number(event.registered) >= Number(event.capacity);
                    var cardStyle = 'background: #fff; border-radius: 4px; padding: 6px; margin-bottom: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: pointer; border-left: 3px solid #3498db; transition: transform 0.1s; overflow:hidden;';
                    if (isFull) { cardStyle += ' opacity: 0.8; border-left-color: #e74c3c;'; }

                    html += '<div class="event-card" style="' + cardStyle + '" data-event-id="' + event.id + '" role="button" tabindex="0">';
                    html += '<div class="event-time" style="font-weight: bold; color: #555; font-size: 0.7em; margin-bottom: 2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🕒 ' + (event.time ? event.time : 'TBA') + '</div>';
                    html += '<div class="event-title" style="font-weight: bold; color: #2c3e50; font-size: 0.8em; line-height: 1.1; margin-bottom: 3px; max-height:2.4em; overflow:hidden;">' + event.title + '</div>';
                    html += '<div class="event-provider" style="font-size: 0.7em; color: #7f8c8d; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + event.provider + '</div>';
                    html += '<div class="event-capacity" style="font-size: 0.65em; color: ' + (isFull ? '#e74c3c' : '#27ae60') + '; margin-top: 4px; text-align: right;">';
                    html += isFull ? '⛔ Full' : '👤 ' + event.registered + '/' + event.capacity;
                    html += '</div></div>';
                });
            }
            html += '</div>';
        });
        html += '</div>';
        $('#program-container').html(html);

        $('.event-card').on('click', function () { showEventModal($(this).data('event-id')); });
        $('.event-card').on('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showEventModal($(this).data('event-id')); }
        });
        $('.event-card').hover(function () { $(this).css('transform', 'translateY(-1px)'); }, function () { $(this).css('transform', 'translateY(0)'); });
    }

    function showEventModal(eventId) {
        var event = (DATA.details || {})[eventId] || (DATA.details || {})[String(eventId)];
        if (!event) { return; }

        $('#modal-event-title').text(event.title);
        $('#modal-event-description').html(event.description);
        $('#modal-event-time').html('<strong>Time:</strong> ' + (event.time ? event.time : 'TBA'));
        var provider = event.provider_link
            ? '<a href="' + event.provider_link + '">' + event.provider + '</a>'
            : event.provider;
        $('#modal-event-provider').html('<p><strong>Provider:</strong> ' + provider + '</p>');
        $('#modal-event-capacity').html('<p><strong>Capacity:</strong> ' + event.registered + '/' + event.capacity + '</p>');

        $('.modal-actions .wa-btn-dynamic').remove();
        $('#modal-whatsapp-link').empty();
        $('#unregister-button').hide();

        var isFull = event.is_full || Number(event.registered) >= Number(event.capacity);
        $('#register-button')
            .show()
            .text(isFull ? 'Session Full' : 'Register for Session')
            .prop('disabled', true)
            .attr({ 'aria-disabled': 'true', title: DISABLED_TITLE })
            .addClass('archive-btn-disabled')
            .off('click');

        if (event.has_whatsapp) {
            $('.modal-actions').append(
                '<span class="wa-btn-dynamic"><span class="btn btn-success archive-btn-disabled" aria-disabled="true" title="' + DISABLED_TITLE + '"'
                + ' style="margin-left: 10px; padding: 5px 15px; font-size: 14px; text-decoration:none; color:#fff; background:#25D366; border:none; border-radius:4px; display:inline-block;">Join WhatsApp</span></span>'
            );
        }

        $('#event-modal').addClass('active');
    }

    $(function () {
        if (!$('#program-container').length) { return; }
        render();
        $('.modal-close, #event-modal').on('click', function (e) {
            if (e.target === this || $(e.target).hasClass('modal-close')) {
                $('#event-modal').removeClass('active');
            }
        });
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape') { $('#event-modal').removeClass('active'); }
        });
    });
})(jQuery);
