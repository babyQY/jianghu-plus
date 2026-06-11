var ac_account_center = null;
var ac_account_center_mask = null;
var ac_login_success = null;
var ac_recharge_cancel = null;
var ac_recharge_success = null;
var ac_origin = "http://account.waveear.com";

window.addEventListener('message', function (event) {
    if (event.data.height) {
        var cheight = window.innerHeight;
        var h = event.data.height;
        ac_account_center.style.height = h + "px";
        ac_account_center.style['margin-top'] = Math.round((cheight - h) / 2) + 'px';
        ac_account_center_mask.style.visibility = 'visible';
    } else if (event.data.token) {
        hideAccountCenter();
        if (ac_login_success) {
            ac_login_success(event.data.token);
        }
    } else if (event.data.transaction) {
        hideAccountCenter();
        if (ac_recharge_success) {
            ac_recharge_success(event.data.transaction);
        }
    } else {
        hideAccountCenter();
        if (ac_recharge_cancel) {
            ac_recharge_cancel();
        }
    }
});

function ac_setStyle(e, style) {
    for (var a in style) {
        e.style[a] = style[a];
    }
}

function showInnerFrame(page, fullscreen) {
    if (ac_account_center) {
        ac_account_center.src = ac_origin + page;
        ac_account_center_mask.style.display = '';
    } else {
        ac_account_center_mask = document.createElement('div');
        ac_setStyle(ac_account_center_mask, {
            position: 'absolute',
            width: '100%',
            height: '100%',
            margin: '0',
            left: '0',
            top: '0',
            visibility: 'hidden'
        });
        var container = document.createElement('div');
        if (fullscreen) {
            ac_setStyle(container, { width: "100%", height: "100%", margin: 'auto' });
        } else {
            ac_setStyle(container, { margin: 'auto', width: '240px' });
        }
        ac_account_center = document.createElement('iframe');
        if (fullscreen) {
            ac_account_center_mask.style.visibility = 'visible';
            ac_setStyle(ac_account_center, { width: "100%", height: "100%", margin: '0' });
        } else {
            ac_setStyle(ac_account_center, { width: '220px', border: 'wheat outset thin', 'border-radius': '5px' });
        }

        ac_account_center.src = ac_origin + page;
        container.appendChild(ac_account_center);
        ac_account_center_mask.appendChild(container);
        document.body.appendChild(ac_account_center_mask);
    }
}
function showAccountCenter() {
    showInnerFrame('/loginpage.php');
}

function hideAccountCenter() {
    if (ac_account_center_mask) {
        ac_account_center_mask.style.display = 'none';
    }
}

function ac_recharge(app_id, token, order_id, product, price, goods) {
    var data = { token: token, order_id: order_id, product: product, price: price, partner: app_id, goods: goods };
    var s = '?';
    for (var i in data) {
        s += i + '=' + data[i] + '&';
    }
    showInnerFrame('/rechargepage.php' + s.substr(0, s.length - 1), true);
}