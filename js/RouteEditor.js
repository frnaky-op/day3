/**
 * RouteEditor
 */
class RouteEditor {
    /**
     * constructor
     */
    constructor() {
        this.nodes = [];
        this.links = [];

        this.isShiftPressed = false;
        this.page = null;
        this.activeObject = null;
        this.viewNode = null;

        this.init();
    }

    init() {
        this.initEditor();
        this.bindHandlers();

        let nodes = JSON.parse(localStorage.getItem('nodes')) || [];
        let links = JSON.parse(localStorage.getItem('links')) || [];

        nodes.forEach(node => {
            let newNode = new Node(this, node.position.left, node.position.top);
            newNode.content = node.content;
        });

        links.forEach(link => {
            let node1 = this.nodes[link.node1_id];
            let node1direction = link.node1direction;
            let node2 = this.nodes[link.node2_id];
            let node2direction = link.node2direction;
            let label1 = nodes[link.node1_id].relations[node1direction];
            let label2 = nodes[link.node2_id].relations[node2direction];
            new Link(this, node1, node2, node1direction, node2direction, label1, label2);
        });

        if (!this.nodes.length) {
            new Node(this, $(window).width() / 2, $(window).height() / 2);
        }
    }

    initEditor() {
        CKEDITOR.replace('editor', {
            height: $('#editorContainer').height() - 144 - 75 - 27,
        });

        CKEDITOR.instances['editor'].on('change', () => {
            if (this.activeObject) {
                if (this.activeObject instanceof Node) {
                    this.activeObject.content = CKEDITOR.instances['editor'].getData();
                }
            }
        });
    }

    bindHandlers() {
        $('#editMode').click(event => {
            event.preventDefault();
            event.stopPropagation();

            $('.active').removeClass('active');
            $('.select').removeClass('select');
        });

        $('#editMode').mousedown(event => {
            if (this.isShiftPressed) {
                event.preventDefault();
                event.stopPropagation();

                this.page = {
                    left: event.pageX,
                    top: event.pageY,
                };
            }
        });

        $(document).mousemove(event => {
            if (this.page) {
                event.preventDefault();
                event.stopPropagation();

                $('#editMode').css({
                    left: event.pageX - this.page.left,
                    top: event.pageY - this.page.top,
                });
            }
        });

        $(document).mouseup(event => {
            if (this.page) {
                event.preventDefault();
                event.stopPropagation();

                $('#editMode').css({
                    left: 0,
                    top: 0,
                });

                this.nodes.forEach(node => {
                    node.setPosition(node.position.left + event.pageX - this.page.left, node.position.top + event.pageY - this.page.top);
                });

                this.page = null;
            }
        });

        $(document).keydown(event => {
            if (16 === event.keyCode) {
                event.preventDefault();
                event.stopPropagation();

                $('#editMode').addClass('grab');

                this.isShiftPressed = true;
            }
        });

        $(document).keyup(event => {
            if (KEY_SHIFT === event.keyCode) {
                event.preventDefault();
                event.stopPropagation();

                $('#editMode').removeClass('grab');

                this.isShiftPressed = false;
            }

            if (KEY_DELETE === event.keyCode) {
                if (this.activeObject) {
                    this.activeObject.remove();
                }
            }
        });

        $('#btnCloseEditor').click(() => $('#editorContainer').removeClass('show'));

        $('.relation-input').on('input', event => {
            if (this.activeObject) {
                if (this.activeObject instanceof Node) {
                    let direction = $(event.target).parent().data('direction');
                    this.activeObject.relations[direction].label = $(event.target).val();
                }
            }
        });

        $('#modeBtnGroup > .btn').click(event => {
            $('#modeBtnGroup > .btn').removeClass('current');
            $(event.target).addClass('current');

            $('.mode').hide();

            let mode = $(event.target).data('mode');
            $('.mode#' + mode + 'Mode').show();

            if ('view' === mode) {
                this.changeNode();
            }
        });

        $('#slideBtnGroup').click(event => {
            this.changeNode($(event.target).data('direction'));
        });

        $('#btnFullScreen').click(() => {
            $('#btnFullScreen').toggleClass('full');

            if ($('#btnFullScreen').hasClass('full')) {
                $('#viewGroup')[0].requestFullscreen();
                return;
            }

            document.exitFullscreen();
        });

        $(window).on('fullscreenchange', () => {
            if (document.fullscreenElement) {
                $('#btnFullScreen').addClass('full');
                return;
            }

            $('#btnFullScreen').removeClass('full');
        });

        $(window).on('unload', () => {
            localStorage.setItem('nodes', JSON.stringify(this.nodes.map(node => node.export())));
            localStorage.setItem('links', JSON.stringify(this.links.map(link => link.export())));
        });
    }

    addNode(node1, node1direction) {
        let left = node1.position.left;
        let top = node1.position.top;

        switch (node1direction) {
            case 1:
                top -= NODE_SIZE * 3;
                break;
            case 2:
                left += NODE_SIZE * 3;
                break;
            case 3:
                top += NODE_SIZE * 3;
                break;
            case 4:
                left -= NODE_SIZE * 3;
                break;
        }

        let node2 = new Node(this, left, top);
        let node2direction = DIRECTION_INVERSE[node1direction];

        new Link(this, node1, node2, node1direction, node2direction);
    }

    editNode(node) {
        this.activeObject = node;

        CKEDITOR.instances['editor'].setData(this.activeObject.content);

        $.each(this.activeObject.relations, (direction, relation) => {
            if (relation) {
                $('.relation[data-direction="' + direction + '"] > span').hide();
                $('.relation[data-direction="' + direction + '"] > input').show().val(relation.label || '');
            } else {
                $('.relation[data-direction="' + direction + '"] > span').show();
                $('.relation[data-direction="' + direction + '"] > input').hide();
            }
        });

        $('#editorContainer').addClass('show');
    }

    changeNode(direction) {
        if (direction) {
            this.viewNode = this.viewNode.relations[direction].link.getAnotherNode(this.viewNode);
        } else {
            this.viewNode = this.nodes[0];
        }

        let $prevSlide = $('#viewGroup > .slide');
        let $nextSlide = $('#slideTemplate').clone().removeAttr('id');

        $prevSlide.addClass('slide-prev slide-prev-' + direction);
        $nextSlide.addClass('slide-next slide-next-' + direction).html(this.viewNode.content);

        $.each(this.viewNode.relations, (direction, relation) => {
            if (relation) {
                $('#slideBtnGroup > .btn[data-direction="' + direction + '"]').removeAttr('disabled').attr('data-label', relation.label || 'relation ' + direction);
            } else {
                $('#slideBtnGroup > .btn[data-direction="' + direction + '"]').attr('disabled', true);
            }
        });

        $('#viewGroup').append($nextSlide);


        setTimeout(() => {
            $prevSlide.remove();
            $nextSlide.removeClass('slide-next slide-next-' + direction);
        }, 1000);
    }
}
