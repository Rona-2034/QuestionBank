$(function() {
	answer_stage_list.initial();
});

var answer_stage_list = {
	initial : function initial() {
		this.bindPage();
		this.bindDelete();
	},

	bindPage : function bindPage() {
		$(".pagination li a").click(function() {
			var pageId = $(this).data("id");
			if (pageId == null || pageId == "")
				return false;
			document.location.href = document.getElementsByTagName('base')[0].href
					+ 'admin/answer-stage-list-' + pageId;
		});
	},

	bindDelete : function bindDelete() {
		$(".delete-btn").click(function() {
			$.ajax({
				headers : {
					'Accept' : 'application/json',
					'Content-Type' : 'application/json'
				},
				type : "GET",
				url : "admin/delete-answer-stage-" + $(this).data("id"),
				success : function(message, tst, jqXHR) {
					if (!util.checkSessionOut(jqXHR))
						return false;
					if (message.result == "success") {
						util.success("删除成功", function() {
							window.location.reload();
						});
					} else {
						util.error("操作失败请稍后尝试:" + message.result);
					}
				},
				error : function(jqXHR, textStatus) {
					util.error("操作失败请稍后尝试");
				}
			});

			return false;
		});
	}
};
