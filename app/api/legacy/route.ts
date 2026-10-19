import legacy from '../../../lib/legacy.json';
export function GET(){return Response.json(legacy,{headers:{'Cache-Control':'no-store'}});}
