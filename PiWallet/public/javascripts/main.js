function goBack() {
    window.history.back();
}
$(document).ready(function () {
    //Xác minh tài khoản
    $('.btn-approve').click(e => {
        const btn = e.target
        const userid = btn.dataset.id
        console.log(userid)
        $('#approved').attr('data-id', userid)
        $('#approve-confirm').modal('show')
    })

    $('#approve-confirm').click(e => {
        $('#approve-confirm').modal('hide')
        const btn = e.target
        const userid = btn.dataset.id
        console.log(userid)
        $.ajax({
            url: '/admin/approve',
            method: 'post',
            data: { userid: userid },
            success: function (data) {
                alert('Account is Actived')
                window.location.reload()
            },
        })
    })

    //Vô hiệu hóa tài khoản
    $('.btn-disable').click(e => {
        const btn = e.target
        const userid = btn.dataset.id
        console.log(userid)
        $('#disabled').attr('data-id', userid)
        $('#disable-confirm').modal('show')
    })

    $('#disable-confirm').click(e => {
        $('#disable-confirm').modal('hide')
        const btn = e.target
        const userid = btn.dataset.id
        console.log(userid)
        $.ajax({
            url: '/admin/disable',
            method: 'post',
            data: { userid: userid },
            success: function (data) {
                alert('Account is Disabled')
                window.location.reload()
            },
        })
    })

    //Gửi yêu cầu cập nhật cmnd
    $('.btn-send').click(e => {
        const btn = e.target
        const userid = btn.dataset.id
        console.log(userid)
        $('#sent').attr('data-id', userid)
        $('#send-confirm').modal('show')
    })

    $('#send-confirm').click(e => {
        $('#send-confirm').modal('hide')
        const btn = e.target
        const userid = btn.dataset.id
        console.log(userid)
        $.ajax({
            url: '/admin/request',
            method: 'post',
            data: { userid: userid },
            success: function (data) {
                alert('Account required additional information')
                window.location.reload()
            },
        })
    })

    //Mở khóa tài khoản bị lock
    $('.btn-unlock').click(e => {
        const btn = e.target
        const userid = btn.dataset.id
        const userName = btn.dataset.name
        const lockedDate = btn.dataset.lock

        console.log(userid)
        console.log(userName)
        console.log(lockedDate)

        $('#account').html(userName)

        $('#unlocked').attr('data-id', userid)
        $('#unlocked').attr('data-lock', lockedDate)

        $('#unlock-confirm').modal('show')
    })

    $('#unlock-confirm').click(e => {
        $('#unlock-confirm').modal('hide')
        const btn = e.target
        const userid = btn.dataset.id
        const lockedDate = btn.dataset.lock

        console.log(lockedDate)
        console.log(userid)
        $.ajax({
            url: '/admin/unlock',
            method: 'post',
            data: { userid: userid, lockedDate: lockedDate },
            success: function (data) {
                alert('Account is Unlocked')
                window.location.reload()
            },
        })
    })

    //Xác nhận giao dịch
    $('.btn-accept').click(e => {
        const btn = e.target
        const transid = btn.dataset.id
        const sender = btn.dataset.sender
        const amount = btn.dataset.amount
        const fee = btn.dataset.fee
        const receiver = btn.dataset.receiver
        console.log(transid)
        console.log(amount)
        console.log(fee)
        console.log(sender)
        console.log(receiver)
        $('#accepted').attr('data-id', transid)
        $('#accepted').attr('data-amount', amount)
        $('#accepted').attr('data-fee', fee)
        $('#accepted').attr('data-sender', sender)
        $('#accepted').attr('data-receiver', receiver)
        $('#accept-confirm').modal('show')
    })

    $('#accept-confirm').click(e => {
        $('#accept-confirm').modal('hide')
        const btn = e.target
        const transid = btn.dataset.id
        const amount = btn.dataset.amount
        const sender = btn.dataset.sender
        const fee = btn.dataset.fee
        const receiver = btn.dataset.receiver
        console.log(transid)
        console.log(amount)
        console.log(sender)
        console.log(fee)
        console.log(receiver)

        $.ajax({
            url: '/admin/accept',
            method: 'post',
            data: { transid: transid, amount: amount, fee: fee, sender: sender, receiver: receiver },
            success: function (data) {
                alert('Transaction is Accepted')
                window.location.reload()
            },
            error: function(){
                alert('User has insufficient balance\nPlease decline this transaction!')
            }
        })
    })

    //Từ chối giao dịch
    $('.btn-decline').click(e => {
        const btn = e.target
        const transid = btn.dataset.id
        console.log(transid)
        $('#declined').attr('data-id', transid)
        $('#decline-confirm').modal('show')
    })

    $('#decline-confirm').click(e => {
        $('#decline-confirm').modal('hide')
        const btn = e.target
        const transid = btn.dataset.id
        console.log(transid)
        $.ajax({
            url: '/admin/decline',
            method: 'post',
            data: { transid: transid },
            success: function (data) {
                alert('Transaction is Declined')
                window.location.reload()
            },
        })
    })
});
