class APIFeatures {
  constructor(query, queryString) {
    this.query = query; // query is the data present in Tour model i.e Tour.find()
    this.queryString = queryString; //queryString is a query which coming from express
  }

  filter() {
    // here this.queryString is equal to req.query
    // here queryObj is a hard copy not a shallow copy. Means if we do any changes in the queryObj object it will not
    //effect the req.query Obj This is the most important trick to create a hard copy in JS.
    // If we directly assign as const queryObj = req.query then as we know objects are references in JS not the actual object.
    // So in order to create a hard or deep copy we use destruturing instead of directly assigning to it a variable.

    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);
    // console.log('req.query: ', req.query);

    // Doing some advance filtering
    let queryStr = JSON.stringify(queryObj);
    // here we are passing the queryObj which is a deep copy
    queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
      // This is for default sorting when user does not specify any sorting
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1; //multiplying by 1 to convert string into a number
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
