jQuery(document).ready(function($) {
    
    // ========================================
    // REGISTRATION PAGE - Custom Product Selection
    // ========================================
    
    if ($('.registration-products').length) {
        $('#registration-form-submit').on('click', function(e) {
            e.preventDefault();
            
            var entryFee = $('input[name="entry_fee"]:checked').val();
            var accommodation = $('input[name="accommodation"]:checked').val();
            var activities = [];
            
            $('input[name="activities[]"]:checked').each(function() {
                activities.push($(this).val());
            });
            
            if (!entryFee) {
                alert('Please select an entry fee option.');
                return;
            }
            
            // Check if using mock data or real products
            if (entryFee.indexOf('mock_') === 0) {
                alert('Please create real WooCommerce products first.');
                return;
            }
            
            // Send AJAX request to add items to cart
            $.ajax({
                url: inuraAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'inura_add_registration_to_cart',
                    nonce: inuraAjax.nonce,
                    entry_fee: entryFee,
                    accommodation: accommodation,
                    activities: activities
                },
                success: function(response) {
                    if (response.success) {
                        window.location.href = response.data.redirect;
                    } else {
                        alert('Error: ' + (response.data.message || 'Unknown error'));
                    }
                },
                error: function() {
                    alert('An error occurred. Please try again.');
                }
            });
        });
    }
    
    // ========================================
    // PROGRAM PAGE - Interactive Program Columns
    // ========================================
    
    if (typeof inuraProgram !== 'undefined' && inuraProgram.isVerified) {
        loadProgramTable();
    }
    
    function loadProgramTable() {
        $('#program-container').html('<div class="loading" style="text-align:center; padding:20px; color:#666;">Loading program...</div>');
        
        $.ajax({
            url: inuraProgram.ajaxUrl,
            type: 'POST',
            data: {
                action: 'inura_get_program',
                nonce: inuraProgram.nonce,
                email: inuraProgram.userEmail
            },
            success: function(response) {
                if (response.success) {
                    renderProgramColumns(response.data);
                } else {
                    $('#program-container').html('<p style="color:red; text-align:center;">Error loading program data.</p>');
                }
            },
            error: function() {
                $('#program-container').html('<p style="color:red; text-align:center;">Connection error. Please try again.</p>');
            }
        });
    }
    
    function renderProgramColumns(data) {
        var days = [
            { id: 1, label: 'Wed, 3rd June' },
            { id: 2, label: 'Thu, 4th June' },
            { id: 3, label: 'Fri, 5th June' },
            { id: 4, label: 'Sat, 6th June' },
            { id: 5, label: 'Sun, 7th June' },
            { id: 6, label: 'Mon, 8th June' }
        ];
        
        var events = data.events || {};
        var userRegistrations = data.userRegistrations || [];
        
        // CSS Injection for Grid Layout
        if (!$('#inura-program-style').length) {
            $('head').append('<style id="inura-program-style">.program-columns-wrapper { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; width: 100%; } .program-day-column { min-width: 0; } @media (max-width: 992px) { .program-columns-wrapper { display: flex; overflow-x: auto; } .program-day-column { min-width: 160px; } }</style>');
        }
        
        var html = '<div class="program-columns-wrapper">';
        
        days.forEach(function(day) {
            html += '<div class="program-day-column" style="background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; padding: 4px; display:flex; flex-direction:column;">';
            html += '<h3 style="text-align: center; font-size: 12px; font-weight:bold; background: #2c3e50; color: #fff; padding: 6px 2px; margin: -4px -4px 8px -4px; border-radius: 4px 4px 0 0;">' + day.label + '</h3>';
            
            var dayEvents = events[day.id] || [];
            
            if (dayEvents.length === 0) {
                html += '<p style="text-align: center; color: #95a5a6; font-style: italic; font-size:0.75em; margin:5px 0;">No events</p>';
            } else {
                dayEvents.forEach(function(event) {
                    var isRegistered = userRegistrations.indexOf(event.id) !== -1 || userRegistrations.indexOf(event.id.toString()) !== -1;
                    var isFull = event.registered >= event.capacity;
                    
                    var cardStyle = 'background: #fff; border-radius: 4px; padding: 6px; margin-bottom: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: pointer; border-left: 3px solid #3498db; transition: transform 0.1s; overflow:hidden;';
                    var cardClass = 'event-card';
                    
                    if (isRegistered) {
                        cardStyle = 'background: #d4edda; border-radius: 4px; padding: 6px; margin-bottom: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: pointer; border-left: 3px solid #27ae60; transition: transform 0.1s; overflow:hidden;';
                        cardClass += ' event-registered';
                    } else if (isFull) {
                         cardStyle += ' opacity: 0.8; border-left-color: #e74c3c;';
                    }
                    
                    html += '<div class="' + cardClass + '" style="' + cardStyle + '" data-event-id="' + event.id + '">';
                    var displayTime = event.time ? event.time : 'TBA';
                    html += '<div class="event-time" style="font-weight: bold; color: #555; font-size: 0.7em; margin-bottom: 2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🕒 ' + displayTime + '</div>';
                    html += '<div class="event-title" style="font-weight: bold; color: #2c3e50; font-size: 0.8em; line-height: 1.1; margin-bottom: 3px; max-height:2.4em; overflow:hidden;">' + event.title + '</div>';
                    html += '<div class="event-provider" style="font-size: 0.7em; color: #7f8c8d; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + event.provider + '</div>';
                    var capColor = isFull ? '#e74c3c' : '#27ae60';
                    html += '<div class="event-capacity" style="font-size: 0.65em; color: ' + capColor + '; margin-top: 4px; text-align: right;">';
                    html += isRegistered ? '✅ Reg.' : (isFull ? '⛔ Full' : '👤 ' + event.registered + '/' + event.capacity);
                    html += '</div></div>';
                });
            }
            html += '</div>';
        });
        html += '</div>';
        $('#program-container').html(html);
        
        $('.event-card').on('click', function() { showEventModal($(this).data('event-id')); });
        $('.event-card').hover(function() { $(this).css('transform', 'translateY(-1px)'); }, function() { $(this).css('transform', 'translateY(0)'); });
    }
    
    function showEventModal(eventId) {
        $.ajax({
            url: inuraProgram.ajaxUrl,
            type: 'POST',
            data: {
                action: 'inura_get_event_details',
                nonce: inuraProgram.nonce,
                event_id: eventId,
                email: inuraProgram.userEmail
            },
            success: function(response) {
                if (response.success) {
                    var event = response.data;
                    
                    $('#modal-event-title').text(event.title);
                    $('#modal-event-description').html(event.description);
                    $('#modal-event-time').html('<strong>Time:</strong> ' + (event.time ? event.time : 'TBA'));
                    $('#modal-event-provider').html('<p><strong>Provider:</strong> <a href="' + event.provider_link + '">' + event.provider + '</a></p>');
                    $('#modal-event-capacity').html('<p><strong>Capacity:</strong> ' + event.registered + '/' + event.capacity + '</p>');
                    
                    var participantsHtml = '';
                    if (event.participants && event.participants.length > 0) {
                        event.participants.forEach(function(p) { participantsHtml += '<li>' + p + '</li>'; });
                    } else { participantsHtml = '<li style="color:#999;">No participants yet</li>'; }
                    $('#modal-participants').html(participantsHtml);
                    
                    // Prepare WhatsApp Button
                    var waBtn = '';
                    if (event.whatsapp_link) {
                        waBtn = '<a href="' + event.whatsapp_link + '" target="_blank" class="btn btn-success" style="margin-left: 10px; padding: 5px 15px; font-size: 14px; text-decoration:none; color:#fff; background:#25D366; border:none; border-radius:4px;">Join WhatsApp</a>';
                    }
                    
                    // Clear old dynamic elements
                    $('.modal-actions .wa-btn-dynamic').remove();
                    $('#modal-whatsapp-link').empty(); // Clear any inline links

                    // Show/Hide Action Buttons based on state
                    if (event.is_user_registered) {
                        $('#register-button').hide();
                        $('#unregister-button').show().text('Drop Session').off('click').on('click', function() { unregisterFromEvent(eventId); });
                    } else {
                        $('#unregister-button').hide();
                        if (event.is_full) {
                            $('#register-button').show().text('Session Full').prop('disabled', true);
                        } else if (event.has_conflict) {
                            $('#register-button').show().text('Time Conflict').prop('disabled', true);
                        } else {
                            $('#register-button').show().text('Register for Session').prop('disabled', false).off('click').on('click', function() { registerForEvent(eventId); });
                        }
                    }

                    // GUNCELLEME: Buton varsa HER DURUMDA ekle (Register veya Drop butonunun yanina duser)
                    if(waBtn) {
                        $('.modal-actions').append('<span class="wa-btn-dynamic">' + waBtn + '</span>');
                    }

                    $('#event-modal').addClass('active');
                }
            }
        });
    }
    
    function registerForEvent(id) {
        $.ajax({ url: inuraProgram.ajaxUrl, type: 'POST', data: { action: 'inura_register_for_event', nonce: inuraProgram.nonce, event_id: id, email: inuraProgram.userEmail },
            success: function(r) { if (r.success) { alert('Successfully registered!'); $('#event-modal').removeClass('active'); loadProgramTable(); } else { alert(r.data.message || 'Registration failed.'); } } });
    }
    function unregisterFromEvent(id) {
        if (!confirm('Are you sure you want to drop this session?')) return;
        $.ajax({ url: inuraProgram.ajaxUrl, type: 'POST', data: { action: 'inura_unregister_from_event', nonce: inuraProgram.nonce, event_id: id, email: inuraProgram.userEmail },
            success: function(r) { if (r.success) { alert('Successfully dropped session!'); $('#event-modal').removeClass('active'); loadProgramTable(); } else { alert('Failed to drop session.'); } } });
    }
    
    // Close modal
    $('.modal-close, .modal').on('click', function(e) {
        if (e.target === this || $(e.target).hasClass('modal-close')) {
            $('#event-modal').removeClass('active');
        }
    });


    // ========================================
    // MOBILE MENU TOGGLE (Telefonda Açılıp Kapanma Sorunu Çözümü)
    // ========================================
    
    // Alt menüsü olan elemanlara tıklanınca
    $('.nav-menu li.menu-item-has-children > a').on('click', function(e) {
        
        // Sadece mobil genişlikte çalışsın (768px ve altı)
        if ($(window).width() <= 768) {
            
            var $parent = $(this).parent(); // Tıklanan linkin kapsayıcı <li>'si
            
            // Eğer menü zaten açık DEĞİLSE
            if (!$parent.hasClass('open')) {
                e.preventDefault(); // Linke gitmeyi engelle
                
                // (İsteğe bağlı) Diğer açık menüleri kapat - Akordeon etkisi
                // $parent.siblings().removeClass('open').find('ul.sub-menu').slideUp(200);
                
                // Tıklananı aç
                $parent.addClass('open');
                $parent.children('ul.sub-menu').slideDown(200);
            } 
            // Eğer menü zaten AÇIKSA
            else {
                e.preventDefault(); // Linke gitmeyi engelle (Menüyü kapatmak için)
                $parent.removeClass('open');
                $parent.children('ul.sub-menu').slideUp(200);
            }
        }
    });

    // Ekran boyutu değişirse (cep telefonunu yan çevirirse) menü stilini resetle
    $(window).resize(function() {
        if ($(window).width() > 768) {
            $('.nav-menu li').removeClass('open');
            $('.nav-menu ul.sub-menu').removeAttr('style');
        }
    });
    
});