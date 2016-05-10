/*
 * publish-time:
 * 参考：http://www.css88.com/doc/backbone/docs/todos.html 
*/

$(function(){// jQuery.ready
	// 创建Todo模型
	var Todo = Backbone.Model.extend({
		defaults: function(){// 定义默认属性
			return {
				title: 'empty todo ...',
				order: todos.nextOrder(),
				done: false
			}
		},
		toggle: function(){
			this.save({done: !this.get('done')});
		}
	});

	// 创建Todo集合,本地存储
	var TodoList = Backbone.Collection.extend({
		model: Todo,
		localStorage: new Backbone.LocalStorage('todos-backbone'),// 确定存储的命名空间
		// 过滤集合中已完成的任务
		done: function(){
			return this.where({done: true});
		},
		// 与done相对
		remaining: function(){
			return this.where({done: false});
		},
		// 将任务放入一个特定序列中，即使任务有序
		nextOrder: function(){
			if (!this.length){
				return 1;
			}
			return this.last().get('order') + 1;
		},
		comparator: 'order'// 任务按存储顺序存储
	})
	// 创建全局Todo集合
	var todos = new TodoList();

	var TodoView = Backbone.View.extend({
		tagName: 'li',
		className: 'todo',
		template: _.template($('#template-1').html()),// 缓存单个任务的模板
		events: {
			'click .j-toggle' : 'toggleDone',
			'dblclick .j-view': 'edit',
			'click .j-destroy': 'clear',
			'keypress .j-edit': 'updateOnEnter',
			'blur .j-edit'    : 'close'
		},
		// 视图监听模型的变化，重新渲染，Todo与TodoView是一一对应的
		initialize: function(){
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);
		},
		render: function(){
			this.$el.html(this.template(this.model.toJSON()));
			this.$el.toggleClass('done', this.model.get('done'));
			this.input = this.$('.j-edit');
			return this;
		},
		toggleDone: function(){
			this.model.toggle();
		},
		edit: function(){
			this.$el.addClass('editing');
			this.input.focus();
		},
		close: function(){
			var value = this.input.val();
			if (!value) {
				this.clear();
			} else {
				this.model.save({title: value});
				this.$el.removeClass('editing');
			}
		},
		updateOnEnter: function(e){
			if (e.keyCode == 13) {
				this.close();
			}
		},
		clear: function(){
			this.model.destroy();
		}
	});

	var AppView = Backbone.View.extend({
		el: $('#todoapp'),
		statsTemplate: _.template($('#template-2').html()),
		events: {
			'keypress .j-new-todo'    : 'createOnEnter',
			'click .j-clear-completed': 'clearCompleted',
			'click .j-toggle-all'     : 'toggleAllComplete'
		},
		initialize: function(){
			// console.log('adasd');
			this.input = this.$('.j-new-todo');
			this.allCheckbox = this.$('.j-toggle-all');
			this.listenTo(todos, 'add', this.addOne);
			this.listenTo(todos, 'reset', this.addAll);
			this.listenTo(todos, 'all', this.render);

			this.footer = this.$('footer');
			this.main = $('.j-main');

			todos.fetch();// 对集合进行默认设置
		},
		render: function(){
			var done = todos.done().length;
			var remaining = todos.remaining().length;

			if (todos.length) {
				// console.log('12321');
				// console.log(this.statsTemplate);
				this.main.show();
				this.footer.show();
				this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
			} else {
				this.main.hide();
				this.footer.hide();
			}
			// console.log(this.allCheckbox);
			this.allCheckbox.checked = !remaining;
		},
		addOne: function(todo){
			// console.log('asdas');
			var view = new TodoView({model: todo});
			this.$('.j-todo-list').append(view.render().el);
		},
		addAll: function(){
			todos.each(this.addOne, this);
		},
		createOnEnter: function(e){
			if (e.keyCode != 13) return;
			if (!this.input.val()) return;
			// console.log(this.input.val());
			todos.create({title: this.input.val()});// 创建一个新的模型实例
			this.input.val('');
		},
		clearCompleted: function(){
			// console.log(todos.done());
			_.invoke(todos.done(), 'destroy');
			return false;
		},
		toggleAllComplete: function(){
			var done = this.allCheckbox.prop('checked');
			todos.each(function(todo){
				todo.save({done: done});
			});
		}
	});

	var App = new AppView();
});
