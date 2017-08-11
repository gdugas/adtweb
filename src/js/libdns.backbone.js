var libdns = {};

libdns.RecordView = Backbone.View.extend({
    model: new Backbone.Model(),
    tagName: 'tr',
    
    initialize: function () {
        this.listenTo(this.model, "change", this.render);
        this.render();
    },
    render: function () {
        var compiled = _.template(this.options.template);
        this.$el.html(compiled(_.extend(this.model.attributes, {cid: this.model.cid})));
        this.$el.attr('data-cid', this.model.cid);
    }
});

libdns.Record = Backbone.Model.extend({
    defaults: {
        'name': null,
        'type': null,
        'cls': 'IN',
        'ttl': null,
        'rdlength': null,
        'rdata': null
    },
    
    initialize: function () {
        this.view = new libdns.RecordView({
            'model': this,
            template: '<td><i class="icon-move"></i><i class="icon-edit"></i><i class="icon-trash"></i></td><td><a href="#record-form" data-cid="<%= cid %>"><%= name %></a></td><td><%= type %></td><td><%= cls %></td><td><%= ttl %></td><td><%= rdlength %></td><td><%= rdata %></td>',
        });
    }
});

// RecordS -------------------------------------------------------------
libdns.RecordsView = Backbone.View.extend({
    initialize: function () {
        this.listenTo(this.collection, "add", this.onAdd);
        this.listenTo(this.collection, "remove", this.onRemove);
    },
    
    onAdd: function (record, x, opts) {
        this.render();
    },
    onRemove: function (record) {
        record.view.$el.detach();
    },
    render: function () {
        var self = this;
        this.$el.empty();
        this.collection.each(function (record) {
            self.$el.append(record.view.$el);
        });
    }
});

libdns.Records = Backbone.Collection.extend({
    model: libdns.Record,
    initialize: function (models, options) {
        this.view = new libdns.RecordsView({
            'collection': this,
            'el': options.container
        });
    }
});



libdns.Zone = Backbone.Model.extend({
    defaults: {
        'ttl': 38400,
        'cls': 'IN',
        'nameserver': null,
        'postmaster': null,
        'sn': null,
        'refresh': 10800,
        'retry': 3600,
        'expire': 604800,
        'minimum': 38400,
        'records': new libdns.Records([], {container: $()})
    }
});


libdns.FormView = Backbone.View.extend({
    events: {
        "submit": "submit"
    },
    initialize: function () { this.$el.modal({'show': false}); },
    hide: function () {
        this.$el.modal('hide');
    },
    show: function (cid) {
        this.render(cid);
        this.$el.modal('show');
    },
    
    submit: function () {
        var cid = this.$('[name=cid]').val(),
            self = this;
        
        if (cid == 0 || ! cid) {
            record = new libdns.Record();
        } else {
            record = this.model.records.get(cid);
        }
        _.each(record.attributes, function (v, k) {
            record.set(k, self.$('[name='+k+']').val());
        });
        if (cid == 0 || ! cid) {
            this.model.records.add(record);
        }
        this.hide();
        return false;
    },
    render: function (cid) {
        var self = this,
            attrs = {};
        
        if (! cid || cid == 0) {
            attrs = libdns.Record.prototype.defaults;
            this.$('input[type=submit]').val('Add');
        } else {
            attrs = this.model.records.get(cid).attributes;
            this.$('input[type=submit]').val('Update');
        }
        _.each(attrs, function (v, k) {
            self.$('[name='+k+']').val(v);
        });
        self.$('[name=cid]').val(cid);
    }
});

libdns.Form = Backbone.Model.extend({
    defaults: {
        'records': null,
        'title': 'New record'
    },
    
    records: new libdns.Records([], {container: $()}),
    
    initialize: function (attributes, options) {
        this.records = options.records;
        this.view = new libdns.FormView({
            'model': this,
            'el': options.container
        });
    }
});
