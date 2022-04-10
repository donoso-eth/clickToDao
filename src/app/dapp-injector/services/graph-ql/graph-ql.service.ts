import { Injectable } from '@angular/core';
import { Apollo, QueryRef, gql } from 'apollo-angular';
import { firstValueFrom, Subscription } from 'rxjs';



const GET_QUERY = `
  query($receiver: String!){
    streams(where:{
          receiver: $receiver
        }
       ) {
    	token {
        id
        symbol
      }
	    createdAtTimestamp
	    updatedAtTimestamp
	    currentFlowRate
	    streamedUntilUpdatedAt
        }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class GraphQlService {
  loading!: boolean;
  posts: any;
   postsQuery!: QueryRef<any>;
  // private querySubscription!: Subscription;
  constructor(private apollo: Apollo) {}
  
  
 async  query() {
    // this.postsQuery = this.apollo.watchQuery<any>({
    //   query: GET_POSTS,
    //   pollInterval: 500,
    // });
    const variables = {receiver: "0x06ee660a1b557c40e6cd9f1af5c54709838b2ca8"};
  const posts = await firstValueFrom(this.apollo.query<any>({
    query: gql(GET_QUERY),
    variables,
    }))

    console.log((posts.data))

    // this.querySubscription = this.postsQuery.valueChanges.subscribe(({ data, loading }) => {
    //   this.loading = loading;
    //   this.posts = data.posts;
    // });
  }
}
