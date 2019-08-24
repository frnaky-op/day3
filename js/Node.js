/**
 * Node
 */
class Node {
    /**
     * constructor
     *
     * @param routeEditor
     * @param left
     * @param top
     */
    constructor(routeEditor, left, top) {
        this.routeEditor = routeEditor;
        this.$el = $('#nodeTemplate').clone().removeAttr('id');
        this.position = {
            left,
            top,
        };
        this.relations = {
            1: null,
            2: null,
            3: null,
            4: null,
        };

        this.page = null;
        this.$dragEl = null;

        this.content = '';

        this.init();
    }

    /**
     * init
     */
    init() {
        $('#editMode').append(this.$el);
        this.routeEditor.nodes.push(this);
        this.setPosition(this.position.left, this.position.top);
        this.bindHandlers();
    }

    /**
     * bind handlers
     */
    bindHandlers() {
        this.$el.click(event => {
            event.preventDefault();
            event.stopPropagation();
        });

        this.$el.dblclick(event => {
            event.preventDefault();
            event.stopPropagation();

            $('.select').removeClass('select');
            this.$el.addClass('active').siblings('.active').removeClass('active');
        });

        this.$el.find('.direction').click(event => {
            event.preventDefault();
            event.stopPropagation();

            let direction = $(event.target).data('direction');

            if (this.relations[direction]) {
                this.relations[direction].link.getAnotherNode(this).$el.dblclick();
            } else {
                this.routeEditor.addNode(this, direction);
            }
        });

        this.$el.find('.direction').mousedown(event => {
            if (this.routeEditor.isShiftPressed) {
                event.preventDefault();
                event.stopPropagation();

                this.$dragEl = $('#dragTemplate').clone().removeAttr('id');
                this.$dragEl.attr('data-direction', $(event.target).data('direction'));
                this.$dragEl.css({
                    left: event.pageX,
                    top: event.pageY,
                });
                $('#editMode').append(this.$dragEl);
            }
        });

        this.$el.mousedown(event => {
            if (!this.routeEditor.isShiftPressed) {
                event.preventDefault();
                event.stopPropagation();

                if (!this.$el.hasClass('active')) {
                    this.page = {
                        left: event.pageX - this.position.left,
                        top: event.pageY - this.position.top,
                    };
                }

                $('.link.active').removeClass('active');
                this.$el.addClass('select').siblings('.select').removeClass('select');

                this.routeEditor.activeObject = this;
            }
        });

        $('#editMode').mousemove(event => {
            if (this.$dragEl) {
                event.preventDefault();
                event.stopPropagation();

                $('.node').addClass('active');

                this.$dragEl.css({
                    left: event.pageX,
                    top: event.pageY,
                });

                return;
            }

            if (this.page) {
                event.preventDefault();
                event.stopPropagation();
                
                this.setPosition(event.pageX - this.page.left, event.pageY - this.page.top);
            }
        });

        $('#editMode').mouseup(event => {
            if (this.$dragEl) {
                event.preventDefault();
                event.stopPropagation();

                if ($(event.target).hasClass('direction')) {
                    let node1 = this;
                    let node1direction = this.$dragEl.data('direction');
                    let node2 = this.routeEditor.nodes.find(node => node.$el[0] === $(event.target).parent().parent()[0]);
                    let node2direction = $(event.target).data('direction');

                    if (node1 === node2 || node1.relations[node1direction] || node2.relations[node2direction]) {
                    } else {
                        new Link(this.routeEditor, node1, node2, node1direction, node2direction);
                    }
                }

                this.$dragEl.remove();
                this.$dragEl = null;
            }

            if (this.page) {
                event.preventDefault();
                event.stopPropagation();

                this.page = null;
            }
        });

        this.$el.find('.btn-delete').click(event => {
            event.preventDefault();
            event.stopPropagation();

            this.remove();
        });

        this.$el.find('.btn-edit').click(event => {
            event.preventDefault();
            event.stopPropagation();

            this.routeEditor.editNode(this);
        });
    }

    /**
     * set node position
     *
     * @param left
     * @param top
     */
    setPosition(left, top) {
        this.position.left = left;
        this.position.top = top;

        this.$el.css(this.position);

        $.each(this.relations, (direction, relation) => {
            if (relation) {
                relation.link.draw();
            }
        });
    }

    /**
     * get point of the node vir direction
     *
     * @param direction
     * @returns {{top: float, left: float}}
     */
    getPointPosition(direction) {
        let left = this.position.left;
        let top = this.position.top;

        switch (direction) {
            case 1:
                top -= NODE_SIZE / 2;
                break;
            case 2:
                left += NODE_SIZE / 2;
                break;
            case 3:
                top += NODE_SIZE / 2;
                break;
            case 4:
                left -= NODE_SIZE / 2;
                break;
        }

        return {
            left,
            top,
        };
    }

    /**
     * remove node
     */
    remove() {
        if (2 > this.routeEditor.nodes.length) {
            return;
        }

        let index = this.routeEditor.nodes.indexOf(this);

        if (-1 < index) {
            this.routeEditor.nodes.splice(index, 1);
        }

        this.$el.remove();

        $.each(this.relations, (direction, relation) => {
            if (relation) {
                relation.link.remove();
            }
        });
    }

    export() {
        let relations = {
            1: this.relations[1] ? this.relations[1].label : null,
            2: this.relations[2] ? this.relations[2].label : null,
            3: this.relations[3] ? this.relations[3].label : null,
            4: this.relations[4] ? this.relations[4].label : null,
        };

        return {
            content: this.content,
            relations,
            position: this.position,
        };
    }
}