
function formatDateTime (datetime) {
  const datetimeMoment = moment(datetime)
  return [
    {text: datetimeMoment.format('dddd, MMMM Do, YYYY'), argument: 'date'},
    {text: ' at '},
    {text: datetimeMoment.format('h:mma'), argument: 'time'}
  ]
}

function formatRange (obj) {
  const start = moment(obj.start)
  const end = moment(obj.end)

  if (obj.allDay) {
    return [
      {text: 'all day '},
      {text: start.format('dddd, MMMM Do, YYYY'), argument: 'date'},
      {text: ' to all day '},
      {text: end.format('dddd, MMMM Do, YYYY'), argument: 'date'}
    ]
  } else if (end.diff(start, 'days') === 0) {
    return [
      {text: start.format('dddd, MMMM Do, YYYY'), argument: 'date'},
      {text: ' at '},
      {text: start.format('h:mma'), argument: 'time'},
      {text: ' to '},
      {text: end.format('h:mma'), argument: 'time'}
    ]
  } else {
    return [
      {text: start.format('dddd, MMMM Do, YYYY'), argument: 'date'},
      {text: ' at '},
      {text: start.format('h:mma'), argument: 'time'},
      {text: ' to '},
      {text: end.format('dddd, MMMM Do, YYYY'), argument: 'date'},
      {text: ' at '},
      {text: end.format('h:mma'), argument: 'time'},
    ]
  }
}

export function eventDemoExecute (result) {
  return _.flatten([
    {text: 'create an event', category: 'action'},
    {text: ' called '},
    {text: result.title, argument: 'calendar event'},
    result.location ? [{text: ' with location '}, {text: result.location, argument: 'location'}] : [],
    {text: ' '},
    formatRange(result.range)
  ])
}


export function reminderDemoExecute (result) {
  const datetime = result.datetime ? [{text: ' due '}].concat(formatDateTime(result.datetime)) : {text: ' without a due date'}

  return _.flatten([
    {text: 'create a reminder', category: 'action'},
    {text: ' called '},
    {text: result.title, argument: 'reminder title'},
    datetime
  ]) 
}